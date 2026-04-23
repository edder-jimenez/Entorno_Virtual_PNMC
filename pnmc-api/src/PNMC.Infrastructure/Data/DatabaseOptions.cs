namespace PNMC.Infrastructure.Data;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    public bool EnsureSupportTables { get; set; } = true;
}
