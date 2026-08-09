using System.Text.Json;
using Microsoft.Extensions.Options;
using RetroDrive.Api.Models;
using RetroDrive.Api.Options;

namespace RetroDrive.Api.Services;

public sealed class LegalContentProvider(
    IOptions<LegalOptions> options,
    ILogger<LegalContentProvider> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string? contentJson = options.Value.ContentJson;

    public LegalContent Get()
    {
        if (string.IsNullOrWhiteSpace(contentJson)) return Default;

        try
        {
            var configured = JsonSerializer.Deserialize<LegalContent>(contentJson, JsonOptions);
            if (IsValid(configured)) return configured!;

            logger.LogWarning("Legal:ContentJson is incomplete. Default legal content is being used.");
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "Legal:ContentJson is not valid JSON. Default legal content is being used.");
        }

        return Default;
    }

    private static bool IsValid(LegalContent? content) =>
        IsValid(content?.Privacy) && IsValid(content?.Terms) && IsValid(content?.Returns);

    private static bool IsValid(LegalPolicy? policy) =>
        policy is not null &&
        !string.IsNullOrWhiteSpace(policy.Title) &&
        policy.Sections is { Count: > 0 } &&
        policy.Sections.All(section => !string.IsNullOrWhiteSpace(section.Heading) && !string.IsNullOrWhiteSpace(section.Body));

    private static LegalContent Default => new(
        new LegalPolicy("Privacy Policy", "Last updated: August 2026",
        [
            new LegalSection("1. Information We Collect", "We collect the information you choose to provide when you submit an inquiry, request financing or transport information, join the arrival list, or contact Framingham Motors. This can include your name, email address, phone number, and vehicle-related message."),
            new LegalSection("2. How We Use Your Information", "We use this information to respond to your request, discuss a vehicle or transaction, provide requested updates, and improve our service. We do not sell your personal information."),
            new LegalSection("3. Browser Storage", "This website uses essential browser storage for features such as saved inventory and form interactions. You can clear this data through your browser settings."),
            new LegalSection("4. Data Security", "We use reasonable technical safeguards for information submitted through this website. Do not send sensitive payment or identity documents through general website forms unless Framingham Motors gives you a secure method to do so."),
            new LegalSection("5. Contact", "Questions about privacy can be sent to Framingham Motors through the contact details on the About page.")
        ]),
        new LegalPolicy("Terms of Service", "Last updated: August 2026",
        [
            new LegalSection("1. Website Use", "By using this website, you agree to use it lawfully and to provide accurate contact information when submitting a request."),
            new LegalSection("2. Vehicle Availability", "Framingham Motors may update inventory, pricing, descriptions, and availability at any time. Every vehicle is subject to prior sale and is available only when confirmed directly by Framingham Motors."),
            new LegalSection("3. Listing Information", "Vehicle information is provided for general reference. Buyers should review the details for the specific vehicle and ask any questions before entering into a transaction."),
            new LegalSection("4. Financing and Transport", "Payment estimates and delivery estimates are planning tools, not offers of credit, final quotes, or guarantees. Final terms are confirmed for the specific transaction."),
            new LegalSection("5. Transaction Documents", "A purchase is governed by the final written documents provided for that vehicle. Those documents control if they differ from website information."),
            new LegalSection("6. Contact", "For questions about these terms, contact Framingham Motors through the contact details on the About page.")
        ]),
        new LegalPolicy("Purchase Terms", "Last updated: August 2026",
        [
            new LegalSection("Vehicle-Specific Terms", "Retro and classic vehicles are unique. Deposit, purchase, cancellation, title, delivery, and any return terms are provided and agreed for the specific vehicle transaction."),
            new LegalSection("Before You Commit", "Review the available vehicle information, ask questions about condition and documentation, and make sure the agreed terms are reflected in the final transaction documents."),
            new LegalSection("Delivery Coordination", "If transport is arranged, the confirmed carrier, route, timing, and handoff details are provided for the specific vehicle. Website delivery estimates are starting points only."),
            new LegalSection("Questions About an Agreement", "Contact Framingham Motors promptly if you have questions about a vehicle, a deposit, delivery, or the documents for your transaction.")
        ]));
}
