namespace PNMC.Infrastructure.Common;

public static class ValidationHelpers
{
    public static bool IsMissing(string? value) => string.IsNullOrWhiteSpace(value);

    public static bool IsValidEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;
        return value.Contains('@') && value.Contains('.');
    }
}
