namespace RetroDrive.Api.Models;

public sealed record LegalContent(
    LegalPolicy Privacy,
    LegalPolicy Terms,
    LegalPolicy Returns);

public sealed record LegalPolicy(
    string Title,
    string Updated,
    IReadOnlyList<LegalSection> Sections);

public sealed record LegalSection(string Heading, string Body);
