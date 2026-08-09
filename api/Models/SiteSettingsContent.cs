namespace RetroDrive.Api.Models;

public sealed record SiteSettingsContent(
    string ShowroomAddress,
    string Phone,
    string Email,
    string ShowroomHours,
    string FooterDescription,
    string FooterHoursTitle,
    string FooterOperationsTitle,
    string FooterVipTitle,
    string FooterVipDescription);
