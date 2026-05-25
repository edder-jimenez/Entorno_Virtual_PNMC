#!/usr/bin/env python3
import argparse
import os
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
import zipfile


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main", "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def sql_string(value):
    if value is None:
        return "NULL"
    text = normalize_text(value).replace("'", "''")
    return "N'{}'".format(text)


def normalize_text(value):
    if value is None:
        return ""
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    lines = [" ".join(part for part in line.split()) for line in text.split("\n")]
    collapsed = "\n".join(line for line in lines if line)
    return collapsed.strip()


def column_index_from_ref(cell_ref):
    letters = "".join(char for char in cell_ref if char.isalpha()).upper()
    index = 0
    for char in letters:
        index = (index * 26) + (ord(char) - ord("A") + 1)
    return max(index - 1, 0)


def read_cell_value(cell, shared):
    inline = cell.find("a:is", NS)
    value_node = cell.find("a:v", NS)
    if inline is not None:
        return "".join(t.text or "" for t in inline.iterfind(".//a:t", NS))
    if value_node is not None:
        return shared[int(value_node.text)] if cell.attrib.get("t") == "s" else (value_node.text or "")
    return ""


def read_catalog_rows(path):
    book = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in book.namelist():
        root = ET.fromstring(book.read("xl/sharedStrings.xml"))
        for si in root.findall("a:si", NS):
            shared.append("".join(t.text or "" for t in si.iterfind(".//a:t", NS)))

    sheet = ET.fromstring(book.read("xl/worksheets/sheet1.xml"))
    rows = sheet.find("a:sheetData", NS).findall("a:row", NS)
    header_row = rows[0]
    header_cells = {}
    max_header_index = 0
    for cell in header_row.findall("a:c", NS):
        cell_ref = cell.attrib.get("r", "A1")
        column_index = column_index_from_ref(cell_ref)
        max_header_index = max(max_header_index, column_index)
        header_cells[column_index] = normalize_text(read_cell_value(cell, shared))

    headers = [header_cells.get(index, "") for index in range(max_header_index + 1)]

    items = []
    for source_order, row in enumerate(rows[1:], start=1):
        values = [""] * len(headers)
        for cell in row.findall("a:c", NS):
            cell_ref = cell.attrib.get("r", "")
            column_index = column_index_from_ref(cell_ref)
            if column_index >= len(values):
                values.extend([""] * (column_index - len(values) + 1))
            values[column_index] = normalize_text(read_cell_value(cell, shared))
        row_data = dict(zip(headers, values))
        if not row_data.get("ID") or not row_data.get("Título"):
            continue
        row_data = sanitize_row(row_data)
        row_data["__source_order"] = source_order
        items.append(row_data)
    return items


def append_field(row, key, value):
    value = normalize_text(value)
    if not value:
        return
    current = normalize_text(row.get(key, ""))
    if not current:
        row[key] = value
    elif value not in current.split("\n"):
        row[key] = f"{current}\n{value}"


def sanitize_cover_text(cover_text, year_value):
    cover_lines = [line.strip() for line in normalize_text(cover_text).split("\n") if line.strip()]
    if not cover_lines:
        return ""
    normalized_year = normalize_text(year_value)
    if normalized_year:
        first_line = cover_lines[0]
        if first_line == normalized_year or re.fullmatch(r"\d{4}", first_line):
            cover_lines = cover_lines[1:]
    return "\n".join(cover_lines)


def sanitize_row(row):
    year_lines = [line.strip() for line in normalize_text(row.get("Año", "")).split("\n") if line.strip()]
    normalized_year_lines = []

    for line in year_lines:
        upper_line = line.upper()
        if "ISBN" in upper_line:
            append_field(row, "ISBN", line)
            continue
        if "ISMN" in upper_line:
            append_field(row, "ISMN", line)
            continue
        if upper_line.startswith("TAMAÑO") or upper_line.startswith("TAMANO"):
            append_field(row, "Tamaño", re.sub(r"^(TAMAÑO|TAMANO)\s*[:]?\s*", "", line, flags=re.IGNORECASE))
            continue
        normalized_year_lines.append(line)

    if normalized_year_lines:
        row["Año"] = normalized_year_lines[0]
        for leftover_line in normalized_year_lines[1:]:
            append_field(row, "Campos adicionales", leftover_line)
    else:
        row["Año"] = ""

    size_lines = [line.strip() for line in normalize_text(row.get("Tamaño", "")).split("\n") if line.strip()]
    normalized_size_lines = []
    for line in size_lines:
        if line.upper().startswith("PÁGINAS") or line.upper().startswith("PAGINAS"):
            append_field(row, "Páginas", re.sub(r"^(PÁGINAS|PAGINAS)\s*[:]?\s*", "", line, flags=re.IGNORECASE))
            continue
        normalized_size_lines.append(line)
    row["Tamaño"] = "\n".join(normalized_size_lines)

    row["Texto de portada/caja"] = sanitize_cover_text(row.get("Texto de portada/caja", ""), row.get("Año", ""))
    return row


def build_sql(rows):
    statements = [
        "SET NOCOUNT ON;",
        "BEGIN TRANSACTION;",
    ]
    for row in rows:
        statements.append(
            """
MERGE dbo.CatalogoEditorial AS target
USING (SELECT {codigo} AS CodigoRecurso) AS source
ON target.CodigoRecurso = source.CodigoRecurso
WHEN MATCHED THEN UPDATE SET
    Titulo = {titulo},
    Anio = {anio},
    SeccionPrincipal = {seccion},
    RutaSeccion = {ruta},
    TipoPublicacion = {tipo},
    PracticaMusical = {practica},
    Categoria = {categoria},
    Subcategoria = {subcategoria},
    Autor = {autor},
    AutorCorporativo = {autor_corporativo},
    CreditosAdicionales = {creditos},
    ISBN = {isbn},
    ISMN = {ismn},
    TamanoFormato = {tamano},
    Paginas = {paginas},
    Duracion = {duracion},
    AmbitoRegional = {ambito},
    UbicacionPublicacion = {ubicacion},
    Url = {url},
    PalabrasClave = {palabras},
    Resumen = {resumen},
    CamposAdicionales = {campos},
    DiapositivaOrigen = {diapositiva},
    ArchivoMiniatura = {miniatura},
    TextoPortada = {portada},
    TextoFuenteCompleto = {fuente},
    OrdenFuente = {orden},
    Activo = 1
WHEN NOT MATCHED THEN INSERT
    (CodigoRecurso, Titulo, Anio, SeccionPrincipal, RutaSeccion, TipoPublicacion, PracticaMusical, Categoria, Subcategoria, Autor, AutorCorporativo, CreditosAdicionales, ISBN, ISMN, TamanoFormato, Paginas, Duracion, AmbitoRegional, UbicacionPublicacion, Url, PalabrasClave, Resumen, CamposAdicionales, DiapositivaOrigen, ArchivoMiniatura, TextoPortada, TextoFuenteCompleto, OrdenFuente, Activo)
    VALUES
    ({codigo}, {titulo}, {anio}, {seccion}, {ruta}, {tipo}, {practica}, {categoria}, {subcategoria}, {autor}, {autor_corporativo}, {creditos}, {isbn}, {ismn}, {tamano}, {paginas}, {duracion}, {ambito}, {ubicacion}, {url}, {palabras}, {resumen}, {campos}, {diapositiva}, {miniatura}, {portada}, {fuente}, {orden}, 1);
            """.format(
                codigo=sql_string(row.get("ID")),
                titulo=sql_string(row.get("Título")),
                anio=sql_string(row.get("Año")),
                seccion=sql_string(row.get("Sección principal")),
                ruta=sql_string(row.get("Ruta de sección")),
                tipo=sql_string(row.get("Tipo de publicación")),
                practica=sql_string(row.get("Práctica musical")),
                categoria=sql_string(row.get("Categoría")),
                subcategoria=sql_string(row.get("Subcategoría")),
                autor=sql_string(row.get("Autor")),
                autor_corporativo=sql_string(row.get("Autor corporativo")),
                creditos=sql_string(row.get("Créditos adicionales")),
                isbn=sql_string(row.get("ISBN")),
                ismn=sql_string(row.get("ISMN")),
                tamano=sql_string(row.get("Tamaño")),
                paginas=sql_string(row.get("Páginas")),
                duracion=sql_string(row.get("Duración")),
                ambito=sql_string(row.get("Ámbito regional")),
                ubicacion=sql_string(row.get("Ubicación de la publicación")),
                url=sql_string(row.get("URL")),
                palabras=sql_string(row.get("Palabras clave")),
                resumen=sql_string(row.get("Resumen")),
                campos=sql_string(row.get("Campos adicionales")),
                diapositiva=sql_string(row.get("Diapositiva origen")),
                miniatura=sql_string(row.get("Archivo miniatura")),
                portada=sql_string(row.get("Texto de portada/caja")),
                fuente=sql_string(row.get("Texto fuente completo")),
                orden=row.get("__source_order", 0),
            )
        )
    statements.append("COMMIT TRANSACTION;")
    return "\n".join(statements)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx_path")
    parser.add_argument("--server", default="127.0.0.1,14333")
    parser.add_argument("--database", default="PNMC_LOCAL")
    parser.add_argument("--user", default="sa")
    parser.add_argument("--password", default="PnmcLocal_2026!")
    args = parser.parse_args()

    rows = read_catalog_rows(args.xlsx_path)
    sql = build_sql(rows)

    with tempfile.NamedTemporaryFile("w", suffix=".sql", delete=False, encoding="utf-8") as handle:
        handle.write(sql)
        temp_path = handle.name

    try:
        subprocess.run(
            [
                "sqlcmd",
                "-S", args.server,
                "-d", args.database,
                "-U", args.user,
                "-P", args.password,
                "-C",
                "-b",
                "-i", temp_path,
            ],
            check=True,
        )
        print("Imported rows:", len(rows))
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


if __name__ == "__main__":
    main()
