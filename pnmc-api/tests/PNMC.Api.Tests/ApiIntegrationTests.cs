using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using PNMC.Contracts;
using Xunit;

namespace PNMC.Api.Tests;

public sealed class ApiIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ApiIntegrationTests(TestWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_Endpoints_ReturnOk()
    {
        var live = await _client.GetAsync("/health/live");
        var ready = await _client.GetAsync("/health/ready");

        Assert.Equal(HttpStatusCode.OK, live.StatusCode);
        Assert.Equal(HttpStatusCode.OK, ready.StatusCode);
        Assert.True(live.Headers.Contains("X-Correlation-ID"));
        Assert.True(ready.Headers.Contains("X-Correlation-ID"));
        Assert.Equal("nosniff", live.Headers.GetValues("X-Content-Type-Options").Single());
        Assert.Equal("DENY", ready.Headers.GetValues("X-Frame-Options").Single());
    }

    [Fact]
    public async Task Agenda_Endpoint_ReturnsItems()
    {
        var response = await _client.GetAsync("/api/v1/agenda/events?limit=10&offset=0");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<PagedResponse<AgendaEventDto>>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Items);
    }

    [Fact]
    public async Task News_Endpoint_ReturnsItems()
    {
        var response = await _client.GetAsync("/api/v1/news/articles?limit=10&offset=0");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<PagedResponse<NewsArticleDto>>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Items);
    }

    [Fact]
    public async Task News_ContentHtml_IsSanitized_OnWrite_AndRead()
    {
        var upsertRequest = new NewsArticleUpsertRequest
        {
            Title = "Noticia Sanitizada",
            Summary = "Resumen sanitizado",
            Category = "General",
            ContentHtml = "<p onclick=\"alert('x')\">Hola</p><script>alert('boom')</script><a href=\"javascript:alert('x')\">link</a>"
        };

        var upsertResponse = await _client.PostAsJsonAsync("/api/v1/admin/data/news/articles", upsertRequest);
        upsertResponse.EnsureSuccessStatusCode();

        var listResponse = await _client.GetAsync("/api/v1/news/articles?limit=100&offset=0&q=Noticia%20Sanitizada");
        listResponse.EnsureSuccessStatusCode();

        var listPayload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<NewsArticleDto>>();
        Assert.NotNull(listPayload);
        var item = Assert.Single(listPayload!.Items);

        Assert.DoesNotContain("<script", item.ContentHtml, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("onclick", item.ContentHtml, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("javascript:", item.ContentHtml, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Participation_Create_And_Get_ByReference_Works()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "individual",
            ActorTypeLabel = "Registro individual",
            ActorName = "Prueba Integracion",
            Email = "prueba@example.com",
            Phone = "3000000000",
            Department = "Bogota D.C.",
            Municipality = "Bogota D.C.",
            MusicalFields = "Formacion",
            Description = "Registro de prueba",
            Contribution = "Aporte de prueba",
            Consent = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var createdPayload = await createResponse.Content.ReadFromJsonAsync<ParticipationSubmissionResponse>();
        Assert.NotNull(createdPayload);
        Assert.False(string.IsNullOrWhiteSpace(createdPayload!.Reference));
        Assert.False(string.IsNullOrWhiteSpace(createdPayload.ExternalSyncStatus));

        var readResponse = await _client.GetAsync($"/api/v1/participation/submissions/{createdPayload.Reference}");
        Assert.Equal(HttpStatusCode.OK, readResponse.StatusCode);
    }

    [Fact]
    public async Task Participation_List_ReturnsPagedItems()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "organization",
            ActorName = "Colectivo Test",
            Email = "colectivo@example.com",
            Phone = "3000000000",
            Department = "Antioquia",
            Municipality = "Medellin",
            MusicalFields = "Formacion",
            Description = "Registro de prueba",
            Contribution = "Aporte de prueba",
            Consent = true
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var listResponse = await _client.GetAsync("/api/v1/participation/submissions?limit=10&offset=0");
        if (!listResponse.IsSuccessStatusCode)
        {
            var errorPayload = await listResponse.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Unexpected status {listResponse.StatusCode}: {errorPayload}");
        }

        var payload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<ParticipationSubmissionSummaryDto>>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Items);
    }

    [Fact]
    public async Task Legacy_MapParticipation_Endpoint_ReturnsExpectedShape()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "individual",
            ActorName = "Legacy Test",
            Email = "legacy@example.com",
            Phone = "3000000000",
            Department = "Bogota D.C.",
            Municipality = "Bogota D.C.",
            MusicalFields = "Formacion",
            Description = "Registro legado",
            Contribution = "Aporte legado",
            Consent = true
        };

        var response = await _client.PostAsJsonAsync("/api/map-participation", request);
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(payload);
        Assert.True(payload!.ContainsKey("reference"));
        Assert.True(payload.ContainsKey("message"));
    }

    [Fact]
    public async Task Admin_Data_Upsert_Agenda_Then_Read_Works()
    {
        var upsertRequest = new AgendaEventUpsertRequest
        {
            Id = string.Empty,
            Title = "Evento Administrado",
            Description = "Registro por endpoint admin",
            Category = "Concierto",
            Date = "2026-09-12",
            TimeLabel = "7:00 PM",
            Location = "Teatro Municipal",
            Municipality = "Medellin",
            Department = "Antioquia",
            Organizer = "Equipo PNMC",
            Tags = ["Piloto", "Backend"]
        };

        var upsertResponse = await _client.PostAsJsonAsync("/api/v1/admin/data/agenda/events", upsertRequest);
        upsertResponse.EnsureSuccessStatusCode();

        var readResponse = await _client.GetAsync("/api/v1/agenda/events?limit=100&offset=0");
        readResponse.EnsureSuccessStatusCode();
        var payload = await readResponse.Content.ReadFromJsonAsync<PagedResponse<AgendaEventDto>>();

        Assert.NotNull(payload);
        Assert.Contains(payload!.Items, item => item.Title == "Evento Administrado");
    }

    [Fact]
    public async Task Admin_Data_Schema_ReturnsFieldDefinitions()
    {
        var response = await _client.GetAsync("/api/v1/admin/data/schema");
        response.EnsureSuccessStatusCode();

        var payload = await response.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(payload);
        Assert.True(payload!.ContainsKey("agenda"));
        Assert.True(payload.ContainsKey("participation"));
    }

    [Fact]
    public async Task Participation_ReturnsBadRequest_WhenMissingRequiredFields()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "",
            ActorName = "",
            Email = "not-an-email",
            Phone = "",
            Department = "",
            Municipality = "",
            MusicalFields = "",
            Description = "",
            Contribution = "",
            Consent = false
        };

        var response = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Participation_ReturnsBadRequest_WhenUrlsAreInvalid()
    {
        var request = new ParticipationSubmissionRequest
        {
            ActorType = "organization",
            ActorName = "Colectivo Test URL",
            Email = "colectivo.url@example.com",
            Phone = "3000000000",
            Department = "Antioquia",
            Municipality = "Medellin",
            MusicalFields = "Formacion",
            Description = "Registro de prueba",
            Contribution = "Aporte de prueba",
            Website = "ftp://invalid-url",
            FacebookUrl = "notaurl",
            Consent = true
        };

        var response = await _client.PostAsJsonAsync("/api/v1/participation/submissions", request);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Catalog_Module_Endpoints_ReturnPagedPayloads()
    {
        var festivalsResponse = await _client.GetAsync("/api/v1/festivals?limit=10&offset=0");
        festivalsResponse.EnsureSuccessStatusCode();
        var festivalsPayload = await festivalsResponse.Content.ReadFromJsonAsync<PagedResponse<FestivalDto>>();
        Assert.NotNull(festivalsPayload);

        var schoolsResponse = await _client.GetAsync("/api/v1/music-schools?limit=10&offset=0");
        schoolsResponse.EnsureSuccessStatusCode();
        var schoolsPayload = await schoolsResponse.Content.ReadFromJsonAsync<PagedResponse<MusicSchoolDto>>();
        Assert.NotNull(schoolsPayload);

        var marketsResponse = await _client.GetAsync("/api/v1/music-markets?limit=10&offset=0");
        marketsResponse.EnsureSuccessStatusCode();
        var marketsPayload = await marketsResponse.Content.ReadFromJsonAsync<PagedResponse<MusicMarketDto>>();
        Assert.NotNull(marketsPayload);

        var divipolaResponse = await _client.GetAsync("/api/v1/divipola/grouped");
        divipolaResponse.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Map_Topology_Endpoints_ReturnNewTerritorialObjects()
    {
        var topologyResponse = await _client.GetAsync("/api/v1/map/topojson/territories");
        topologyResponse.EnsureSuccessStatusCode();

        await using var topologyStream = await topologyResponse.Content.ReadAsStreamAsync();
        using var topologyDocument = await JsonDocument.ParseAsync(topologyStream);
        Assert.Equal("Topology", topologyDocument.RootElement.GetProperty("type").GetString());

        var objects = topologyDocument.RootElement.GetProperty("objects");
        Assert.True(objects.TryGetProperty("MGN_ADM_DPTO_POLITICO", out var departmentsObject));
        Assert.True(objects.TryGetProperty("MGN_ADM_MPIO_GRAFICO", out var municipalitiesObject));
        Assert.True(departmentsObject.GetProperty("geometries").GetArrayLength() > 0);
        Assert.True(municipalitiesObject.GetProperty("geometries").GetArrayLength() > 0);

        var compatibilityResponse = await _client.GetAsync("/api/v1/map/geojson/departments");
        compatibilityResponse.EnsureSuccessStatusCode();
        await using var compatibilityStream = await compatibilityResponse.Content.ReadAsStreamAsync();
        using var compatibilityDocument = await JsonDocument.ParseAsync(compatibilityStream);
        Assert.Equal("Topology", compatibilityDocument.RootElement.GetProperty("type").GetString());
    }
}
