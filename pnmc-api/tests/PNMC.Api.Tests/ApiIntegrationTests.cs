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

    private async Task LoginAsWebmasterAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "test@pnmc.local",
            Password = "pnmc-master"
        });
        response.EnsureSuccessStatusCode();
    }

    private async Task LoginAsAllyAdminAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "aliado.admin@pnmc.local",
            Password = "pnmc-aliado-admin"
        });
        response.EnsureSuccessStatusCode();
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
        Assert.True(payload.ContainsKey("gallery"));
    }

    [Fact]
    public async Task Ally_Request_Can_Be_Created_Reviewed_And_Approved()
    {
        var request = new AdminAllyRequestCreateRequest
        {
            EntityName = "Red Aliada Test",
            EntityType = "red",
            Nit = "900123456",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            InstitutionalEmail = "contacto@redaliada.test",
            InstitutionalPhone = "3000000000",
            AdminName = "Admin Aliado",
            AdminEmail = "admin@redaliada.test"
        };

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/ally-requests", request);
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<AdminAllyRequestDto>();
        Assert.NotNull(created);
        Assert.Equal("pendiente", created!.Status);

        var approveResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/ally-requests/{created.Id}/status",
            new AdminAllyRequestStatusRequest
            {
                Status = "aprobada",
                Comment = "Solicitud verificada en prueba."
            });
        approveResponse.EnsureSuccessStatusCode();

        var approved = await approveResponse.Content.ReadFromJsonAsync<AdminAllyRequestDto>();
        Assert.NotNull(approved);
        Assert.Equal("aprobada", approved!.Status);
        Assert.False(string.IsNullOrWhiteSpace(approved.AllyEntityId));

        var listResponse = await _client.GetAsync("/api/v1/admin/ally-requests?status=aprobada");
        listResponse.EnsureSuccessStatusCode();
        var listPayload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<AdminAllyRequestDto>>();
        Assert.NotNull(listPayload);
        Assert.Contains(listPayload!.Items, item => item.Id == created.Id);
    }

    [Fact]
    public async Task External_User_Can_Register_As_Person_With_Email_Pending()
    {
        var request = new ExternalRegisterRequest
        {
            ProfileType = "persona",
            ActorType = "gestor cultural",
            FullName = "Persona Externa Test",
            Email = "persona.externa@example.com",
            Phone = "3000000000",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveExterna123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        };

        var response = await _client.PostAsJsonAsync("/api/v1/external/auth/register", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        Assert.NotNull(payload);
        Assert.Equal("correo_pendiente", payload!.AccountStatus);
        Assert.Equal("codigo_generado", payload.VerificationStatus);
    }

    [Fact]
    public async Task External_User_Can_Register_As_Organization_With_Email_Pending()
    {
        var request = new ExternalRegisterRequest
        {
            ProfileType = "organizacion",
            ActorType = "festival",
            OrganizationName = "Organizacion Externa Test",
            ContactName = "Contacto Principal",
            Email = "organizacion.externa@example.com",
            Phone = "3000000001",
            DepartmentCode = "05",
            MunicipalityCode = "05001",
            Password = "ClaveOrganizacion123",
            AcceptTerms = true,
            AcceptDataPolicy = true,
            AuthorizePublicData = true
        };

        var response = await _client.PostAsJsonAsync("/api/v1/external/auth/register", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<ExternalRegisterResponse>();
        Assert.NotNull(payload);
        Assert.Equal("organizacion.externa@example.com", payload!.Email);
        Assert.Equal("correo_pendiente", payload.AccountStatus);
    }

    [Fact]
    public async Task Admin_Global_User_Rejects_Obsolete_Role()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/users", new AdminUserUpsertRequest
        {
            FullName = "Editor Obsoleto",
            Email = "editor.obsoleto@pnmc.local",
            Role = "editor",
            Password = "ClaveEditor123",
            IsActive = true
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("rol indicado no puede asignarse", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Admin_Global_User_Can_Create_External_Role()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/admin/auth/users", new AdminUserUpsertRequest
        {
            FullName = "Externo Administrado",
            Email = "externo.administrado@pnmc.local",
            Role = "externo",
            Password = "ClaveExterno123",
            IsActive = true
        });

        response.EnsureSuccessStatusCode();
        var payload = await response.Content.ReadFromJsonAsync<AdminAuthResponse>();
        Assert.NotNull(payload);
        Assert.Equal("externo", payload!.User.Role);
    }

    [Fact]
    public async Task Admin_Users_List_Includes_Final_Roles_And_Ally_Scope()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.GetAsync("/api/v1/admin/auth/users");
        response.EnsureSuccessStatusCode();

        var users = await response.Content.ReadFromJsonAsync<List<AdminUserDto>>();
        Assert.NotNull(users);
        Assert.Contains(users!, item => item.Role == "webmaster");
        Assert.Contains(users!, item => item.Role == "gestor_interno");
        Assert.Contains(users!, item => item.Role == "externo");
        Assert.Contains(users!, item => item.Role == "aliado_admin" && item.AllyEntityId == "1");
    }

    [Fact]
    public async Task Webmaster_Can_Change_Ecosystem_Record_Status()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync(
            "/api/v1/admin/data/records/festivals/1/status",
            new AdminRecordStatusRequest
            {
                Status = "publicado",
                Comment = "Validación técnica de permisos de webmaster."
            });

        if (!response.IsSuccessStatusCode)
        {
            var errorPayload = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException($"Unexpected status {response.StatusCode}: {errorPayload}");
        }
    }

    [Fact]
    public async Task Admin_Editorial_Resource_Is_Separate_From_Gallery_Albums()
    {
        await LoginAsWebmasterAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/data/editorial/resources", new EditorialResourceUpsertRequest
        {
            Title = "Recurso Editorial Separado",
            Summary = "Resumen editorial de prueba",
            Category = "Investigacion",
            Year = "2026",
            Author = "Equipo PNMC",
            Keywords = ["editorial", "prueba"]
        });
        createResponse.EnsureSuccessStatusCode();

        var editorialResponse = await _client.GetAsync("/api/v1/admin/data/records/editorial?limit=100");
        editorialResponse.EnsureSuccessStatusCode();
        var editorialBody = await editorialResponse.Content.ReadAsStringAsync();
        Assert.Contains("Recurso Editorial Separado", editorialBody);

        var galleryResponse = await _client.GetAsync("/api/v1/admin/data/records/gallery?limit=100");
        galleryResponse.EnsureSuccessStatusCode();
        var galleryBody = await galleryResponse.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Recurso Editorial Separado", galleryBody);
    }

    [Fact]
    public async Task Notifications_Internal_Can_Be_Created_Listed_And_Read()
    {
        await LoginAsWebmasterAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/v1/admin/notifications", new NotificationCreateRequest
        {
            RecipientEmail = "test@pnmc.local",
            EventType = "registro_aprobado",
            Channel = "internal",
            Title = "Registro aprobado",
            Body = "Tu registro fue aprobado por el equipo PNMC.",
            ModuleId = "festivals",
            RecordId = "1"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<NotificationDto>();
        Assert.NotNull(created);
        Assert.Equal("enviada", created!.Status);
        Assert.Equal("internal", created.Channel);

        var listResponse = await _client.GetAsync("/api/v1/notifications");
        listResponse.EnsureSuccessStatusCode();
        var listPayload = await listResponse.Content.ReadFromJsonAsync<PagedResponse<NotificationDto>>();
        Assert.NotNull(listPayload);
        Assert.Contains(listPayload!.Items, item => item.Id == created.Id);

        var readResponse = await _client.PostAsync($"/api/v1/notifications/{created.Id}/read", null);
        readResponse.EnsureSuccessStatusCode();
        var read = await readResponse.Content.ReadFromJsonAsync<NotificationDto>();
        Assert.NotNull(read);
        Assert.Equal("leida", read!.Status);
        Assert.NotNull(read.ReadAt);
    }

    [Fact]
    public async Task Notifications_Reject_Whatsapp_Without_Configured_Provider()
    {
        await LoginAsWebmasterAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/admin/notifications", new NotificationCreateRequest
        {
            RecipientEmail = "test@pnmc.local",
            EventType = "recordatorio_actualizacion",
            Channel = "whatsapp",
            Title = "Recordatorio",
            Body = "Actualiza tu informacion."
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("WhatsApp", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Ally_Admin_Can_Create_List_And_Deactivate_Entity_User()
    {
        await LoginAsAllyAdminAsync();

        var createResponse = await _client.PostAsJsonAsync("/api/v1/ally/users", new AllyPortalUserCreateRequest
        {
            FullName = "Editor Entidad Test",
            Email = "editor.entidad@pnmc.local",
            Role = "aliado_editor",
            Password = "ClaveAliado123"
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

        var created = await createResponse.Content.ReadFromJsonAsync<AllyPortalUserDto>();
        Assert.NotNull(created);
        Assert.Equal("aliado_editor", created!.Role);
        Assert.Equal("1", created.AllyEntityId);

        var listResponse = await _client.GetAsync("/api/v1/ally/users");
        listResponse.EnsureSuccessStatusCode();
        var users = await listResponse.Content.ReadFromJsonAsync<List<AllyPortalUserDto>>();
        Assert.NotNull(users);
        Assert.Contains(users!, item => item.Email == "editor.entidad@pnmc.local" && item.AllyEntityId == "1");

        var deactivateResponse = await _client.PatchAsJsonAsync(
            $"/api/v1/ally/users/{created.Id}/status",
            new AllyPortalUserStatusRequest { IsActive = false });
        deactivateResponse.EnsureSuccessStatusCode();

        var deactivated = await deactivateResponse.Content.ReadFromJsonAsync<AllyPortalUserDto>();
        Assert.NotNull(deactivated);
        Assert.False(deactivated!.IsActive);
    }

    [Fact]
    public async Task Ally_Admin_Cannot_Create_Global_Or_Admin_Ally_User()
    {
        await LoginAsAllyAdminAsync();

        var response = await _client.PostAsJsonAsync("/api/v1/ally/users", new AllyPortalUserCreateRequest
        {
            FullName = "Admin No Permitido",
            Email = "admin.no.permitido@pnmc.local",
            Role = "aliado_admin",
            Password = "ClaveAliado123"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("aliado_editor", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Ally_User_Without_Entity_Cannot_Manage_Entity_Users()
    {
        var login = await _client.PostAsJsonAsync("/api/v1/admin/auth/login", new AdminLoginRequest
        {
            Email = "aliado.sin.entidad@pnmc.local",
            Password = "pnmc-aliado-editor"
        });
        login.EnsureSuccessStatusCode();

        var response = await _client.GetAsync("/api/v1/ally/users");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Record_Governance_Creates_Link_Duplicate_And_Quality_Items()
    {
        await LoginAsWebmasterAsync();

        var linkResponse = await _client.PostAsJsonAsync("/api/v1/record-link-requests", new RecordLinkRequestCreateRequest
        {
            ModuleId = "festivals",
            RecordId = "1",
            RequestedScope = "responsable",
            Reason = "Solicito revisar la vinculacion con este registro historico.",
            EvidenceText = "Coinciden nombre, municipio y contacto."
        });
        Assert.Equal(HttpStatusCode.Created, linkResponse.StatusCode);

        var link = await linkResponse.Content.ReadFromJsonAsync<RecordLinkRequestDto>();
        Assert.NotNull(link);
        Assert.Equal("pendiente", link!.Status);

        var linkStatusResponse = await _client.PostAsJsonAsync(
            $"/api/v1/admin/record-link-requests/{link.Id}/status",
            new RecordLinkRequestStatusRequest
            {
                Status = "en_revision",
                Comment = "Solicitud recibida para verificacion interna."
            });
        linkStatusResponse.EnsureSuccessStatusCode();

        var duplicateResponse = await _client.PostAsJsonAsync("/api/v1/admin/duplicates", new RecordDuplicateCandidateCreateRequest
        {
            ModuleId = "festivals",
            SourceRecordId = "1",
            CandidateRecordId = "2",
            SimilarityLevel = "media",
            SimilarityScore = 72.5m,
            EvidenceJson = "{\"name\":\"similar\"}"
        });
        Assert.Equal(HttpStatusCode.Created, duplicateResponse.StatusCode);

        var duplicate = await duplicateResponse.Content.ReadFromJsonAsync<RecordDuplicateCandidateDto>();
        Assert.NotNull(duplicate);
        Assert.Equal("pendiente", duplicate!.Status);

        var qualityResponse = await _client.PostAsJsonAsync("/api/v1/admin/data-quality/flags", new RecordQualityFlagCreateRequest
        {
            ModuleId = "festivals",
            RecordId = "1",
            FlagType = "requiere_actualizacion",
            Severity = "media",
            Detail = "Registro publicado sin actualizacion reciente."
        });
        Assert.Equal(HttpStatusCode.Created, qualityResponse.StatusCode);

        var quality = await qualityResponse.Content.ReadFromJsonAsync<RecordQualityFlagDto>();
        Assert.NotNull(quality);
        Assert.Equal("abierta", quality!.Status);
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
