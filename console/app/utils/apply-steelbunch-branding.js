/**
 * Applies Steelbunch TMS branding defaults to a brand model.
 * Overrides any Fleetbase-branded logo/icon/theme values.
 *
 * @param {BrandModel} brand
 * @returns {BrandModel}
 */
export default function applySteelbunchBranding(brand) {
    if (!brand) {
        return brand;
    }

    if (!brand.logo_url || brand.logo_url.includes('fleetbase')) {
        brand.set('logo_url', '/images/steelbunch-logo.png');
    }
    if (!brand.icon_url || brand.icon_url.includes('fleetbase')) {
        brand.set('icon_url', '/images/steelbunch-logo.png');
    }
    brand.set('default_theme', 'dark');

    return brand;
}
