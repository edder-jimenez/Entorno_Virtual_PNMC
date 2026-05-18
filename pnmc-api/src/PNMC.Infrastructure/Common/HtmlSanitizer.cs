using System.Text.RegularExpressions;

namespace PNMC.Infrastructure.Common;

public static partial class HtmlSanitizer
{
    [GeneratedRegex(@"<\s*(script|style|iframe|object|embed|frame|frameset|meta|link|base)\b[^>]*>[\s\S]*?<\s*/\s*\1\s*>", RegexOptions.IgnoreCase)]
    private static partial Regex DangerousBlockTagRegex();

    [GeneratedRegex(@"\s+on[a-z]+\s*=\s*(?:""[^""]*""|'[^']*'|[^\s>]+)", RegexOptions.IgnoreCase)]
    private static partial Regex EventAttributeRegex();

    [GeneratedRegex(@"(href|src)\s*=\s*(?:""\s*javascript:[^""]*""|'\s*javascript:[^']*'|\s*javascript:[^\s>]+)", RegexOptions.IgnoreCase)]
    private static partial Regex JavascriptProtocolRegex();

    [GeneratedRegex(@"<!--[\s\S]*?-->", RegexOptions.IgnoreCase)]
    private static partial Regex HtmlCommentRegex();

    public static string SanitizeRichHtml(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var sanitized = value.Trim();
        sanitized = HtmlCommentRegex().Replace(sanitized, string.Empty);
        sanitized = DangerousBlockTagRegex().Replace(sanitized, string.Empty);
        sanitized = EventAttributeRegex().Replace(sanitized, string.Empty);
        sanitized = JavascriptProtocolRegex().Replace(sanitized, "$1=\"#\"");

        return sanitized.Trim();
    }
}
