using System.Text.Json;
using Microsoft.Extensions.Options;
using RetroDrive.Api.Models;
using RetroDrive.Api.Options;

namespace RetroDrive.Api.Services;

public sealed class TrustedNetworkContentProvider(
    IOptions<TrustedNetworkOptions> options,
    ILogger<TrustedNetworkContentProvider> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string? contentJson = options.Value.ContentJson;

    public TrustedNetworkContent Get()
    {
        if (string.IsNullOrWhiteSpace(contentJson)) return Default;

        try
        {
            var configured = JsonSerializer.Deserialize<TrustedNetworkContent>(contentJson, JsonOptions);
            if (IsValid(configured)) return MergeWithDefaults(configured!);

            logger.LogWarning("TrustedNetwork:ContentJson is incomplete. Default trusted-network content is being used.");
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "TrustedNetwork:ContentJson is not valid JSON. Default trusted-network content is being used.");
        }

        return Default;
    }

    private static bool IsValid(TrustedNetworkContent? content) =>
        content is not null &&
        content.Metrics is { Count: > 0 } &&
        content.Credentials is { Count: > 0 } &&
        content.Partners is { Count: > 0 } &&
        !string.IsNullOrWhiteSpace(content.Title);

    private static TrustedNetworkContent MergeWithDefaults(TrustedNetworkContent configured)
    {
        var defaults = Default;
        return configured with
        {
            Metrics = AddMissing(configured.Metrics, defaults.Metrics),
            Credentials = AddMissing(configured.Credentials, defaults.Credentials),
            Partners = AddMissing(configured.Partners, defaults.Partners),
            Eyebrow = string.IsNullOrWhiteSpace(configured.Eyebrow) ? defaults.Eyebrow : configured.Eyebrow,
            Description = string.IsNullOrWhiteSpace(configured.Description) ? defaults.Description : configured.Description
        };
    }

    private static IReadOnlyList<T> AddMissing<T>(IReadOnlyList<T> configured, IReadOnlyList<T> defaults) =>
        configured.Count >= defaults.Count ? configured : configured.Concat(defaults.Skip(configured.Count)).ToList();

    private static TrustedNetworkContent Default => new(
        [
            new TrustMetric("Framingham, MA", "Showroom location", "Visits by appointment"),
            new TrustMetric("Vehicle-first", "Every listing", "Specs, photos, and context"),
            new TrustMetric("Nationwide", "Transport planning", "Route estimates when needed"),
            new TrustMetric("Direct", "Framingham support", "Questions welcomed")
        ],
        "The Framingham approach",
        "CLASSICS, CLEARLY PRESENTED",
        "Framingham Motors keeps the process centered on the vehicle, the details that matter, and a clear next step.",
        [
            new TrustCredential("licensed", "Vehicle-first listings", "Each listing brings together available specifications, photos, and context.", "Explore"),
            new TrustCredential("authorized", "Details before decisions", "Use the finance and transport tools when you are ready to plan.", "Plan"),
            new TrustCredential("certified", "Personal next steps", "Ask about a vehicle, trade-in, finance request, or delivery from one place.", "Connect")
        ],
        [
            new TrustPartner("01", "Ally", "Finance partner", "/partners/ally.svg"),
            new TrustPartner("02", "Capital One", "Finance partner", "/partners/capitalone.svg"),
            new TrustPartner("03", "Montway", "Transport partner", "/partners/montway.svg"),
            new TrustPartner("04", "AutoTrader", "Marketplace partner", "/partners/autotrader.svg"),
            new TrustPartner("05", "CARFAX", "Vehicle history partner", "/partners/carfax.svg"),
            new TrustPartner("06", "CarShield", "Protection partner", "/partners/carshield.svg")
        ]);
}
