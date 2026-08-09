namespace RetroDrive.Api.Options;

public sealed class ShippingOptions
{
    public const string SectionName = "Shipping";

    // Supplied through Render as Shipping__PickupAddress, Shipping__PickupLatitude, and Shipping__PickupLongitude.
    public string PickupAddress { get; init; } = "865 Waverly St, Framingham, MA 01701";
    public double PickupLatitude { get; init; } = 42.2738807;
    public double PickupLongitude { get; init; } = -71.4336963;
}
