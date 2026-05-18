namespace PNMC.Infrastructure.Data;

public sealed class DatabaseOptions
{
    public const string SectionName = "Database";

    public bool EnsureSupportTables { get; set; } = true;
    public int StartupTimeoutSeconds { get; set; } = 45;
    public bool ContinueOnStartupFailure { get; set; } = true;
}
