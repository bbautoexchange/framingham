using System.Text.Json;
using Microsoft.Extensions.Options;
using RetroDrive.Api.Models;
using RetroDrive.Api.Options;

namespace RetroDrive.Api.Services;

public sealed class AboutContentProvider(
    IOptions<AboutOptions> options,
    ILogger<AboutContentProvider> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly string? contentJson = options.Value.ContentJson;

    public AboutContent Get()
    {
        if (string.IsNullOrWhiteSpace(contentJson)) return Default;

        try
        {
            var configured = JsonSerializer.Deserialize<AboutContent>(contentJson, JsonOptions);
            if (configured is not null) return MergeWithDefaults(configured);
            logger.LogWarning("About:ContentJson is empty. Default about content is being used.");
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "About:ContentJson is not valid JSON. Default about content is being used.");
        }

        return Default;
    }

    private static AboutContent MergeWithDefaults(AboutContent configured)
    {
        var defaults = Default;
        var story = configured.Story;
        var contact = configured.Contact;

        return new AboutContent(
            Pick(configured.Eyebrow, defaults.Eyebrow),
            Pick(configured.Title, defaults.Title),
            Pick(configured.Intro, defaults.Intro),
            new AboutStory(
                Pick(story?.Title, defaults.Story.Title),
                story?.Paragraphs is { Count: > 0 } ? story.Paragraphs : defaults.Story.Paragraphs,
                Pick(story?.ImageCaption, defaults.Story.ImageCaption),
                Pick(story?.LicenseTitle, defaults.Story.LicenseTitle),
                Pick(story?.LicenseDetail, defaults.Story.LicenseDetail)),
            new AboutContact(
                Pick(contact?.Title, defaults.Contact.Title),
                Pick(contact?.AddressLabel, defaults.Contact.AddressLabel),
                Pick(contact?.Address, defaults.Contact.Address),
                Pick(contact?.PhoneLabel, defaults.Contact.PhoneLabel),
                Pick(contact?.Phone, defaults.Contact.Phone),
                Pick(contact?.PhoneDetail, defaults.Contact.PhoneDetail),
                Pick(contact?.EmailLabel, defaults.Contact.EmailLabel),
                Pick(contact?.Email, defaults.Contact.Email),
                Pick(contact?.EmailDetail, defaults.Contact.EmailDetail),
                Pick(contact?.HoursLabel, defaults.Contact.HoursLabel),
                Pick(contact?.Hours, defaults.Contact.Hours)),
            configured.Stats is { Count: > 0 } ? configured.Stats : defaults.Stats);
    }

    private static string Pick(string? value, string fallback) => string.IsNullOrWhiteSpace(value) ? fallback : value;

    private static AboutContent Default => new(
        "Who we are",
        "ABOUT FRAMINGHAM MOTORS",
        "Framingham Motors, Inc. focuses on retro and classic collectible cars, with clear information and a straightforward buying experience.",
        new AboutStory(
            "Our Story",
            [
                "Framingham Motors is for people who value the character, history, and driving feel that make a retro or classic vehicle memorable.",
                "We keep the focus on thoughtful presentation and the details that help you understand each car before making a decision.",
                "Every conversation starts with what matters to you: the vehicle, its condition, your timeline, and the right next step."
            ],
            "The Framingham standard: timeless vehicles and clear details.",
            "Retro and classic vehicle specialists",
            "Vehicle, documentation, and delivery details are reviewed with you before the next step."),
        new AboutContact(
            "Contact & Location",
            "Showroom address",
            "865 Waverly St, Framingham, MA 01701",
            "Phone",
            "(508) 306-8170",
            "Appointments and calls are coordinated directly with the Framingham Motors team.",
            "Email",
            "sales@framinghammotors.com",
            "We respond as soon as possible during business hours.",
            "Business hours",
            "Monday–Friday: 9:00 AM–6:00 PM\nSaturday: 10:00 AM–4:00 PM\nSunday: By appointment"),
        [
            new AboutStat("Framingham, MA", "Showroom", "Visits by appointment"),
            new AboutStat("Nationwide", "Transport planning", "Route estimates available"),
            new AboutStat("Direct", "Personal support", "Clear answers at every step"),
            new AboutStat("Detailed", "Vehicle information", "Condition and history context")
        ]);
}
