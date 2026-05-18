using System.Net.Mail;
using System.Text;

namespace PNMC.Infrastructure.Common;

public static class ValidationHelpers
{
    public static bool IsMissing(string? value) => string.IsNullOrWhiteSpace(value);

    public static bool IsValidEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return false;

        try
        {
            var parsed = new MailAddress(value.Trim());
            return string.Equals(parsed.Address, value.Trim(), StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return false;
        }
    }

    public static bool IsValidHttpUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return true;
        }

        var trimmed = value.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
        {
            return false;
        }

        return string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
            || string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase);
    }

    public static string SanitizeText(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        var builder = new StringBuilder(trimmed.Length);
        foreach (var ch in trimmed)
        {
            if (!char.IsControl(ch) || ch is '\n' or '\r' or '\t')
            {
                builder.Append(ch);
            }
        }

        var sanitized = builder.ToString().Trim();
        if (sanitized.Length <= maxLength)
        {
            return sanitized;
        }

        return sanitized[..maxLength].TrimEnd();
    }
}
