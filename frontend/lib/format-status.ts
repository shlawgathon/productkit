/**
 * Formats status enum values into human-readable labels
 * @param status - The status enum value (e.g., "GENERATING_IMAGES", "POST_COMPLETION_ASSETS")
 * @returns Beautified status label (e.g., "Generating Images", "Finalizing Assets")
 */
export function formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
        // Backend enum values
        DRAFT: "Draft",
        PROCESSING: "Processing",
        GENERATING_IMAGES: "Generating Images",
        GENERATING_COPY: "Generating Copy",
        GENERATING_SITE: "Generating Site",
        GENERATING_3D_MODEL: "Generating 3D Model",
        GENERATING_VIDEO: "Generating Video",
        SYNCING_SHOPIFY: "Syncing to Shopify",
        POST_COMPLETION_ASSETS: "Finalizing Assets",
        COMPLETED: "Active",
        ERROR: "Error",

        // Frontend mapped values (for backward compatibility)
        active: "Active",
        draft: "Draft",
        generating: "Generating",
        error: "Error",
        post_completion_assets: "Finalizing Assets",
    };

    return statusMap[status] || status.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Gets the appropriate color class for a status badge
 * @param status - The status enum value
 * @returns Tailwind CSS class names for styling the status badge
 */
export function getStatusColorClass(status: string): string {
    // Normalize to uppercase for comparison
    const normalizedStatus = status.toUpperCase();

    if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'ACTIVE') {
        return 'text-green-600 font-medium';
    }

    if (normalizedStatus === 'ERROR') {
        return 'text-red-600 font-medium';
    }

    if (normalizedStatus === 'DRAFT') {
        return 'text-gray-600 font-medium';
    }

    if (normalizedStatus === 'POST_COMPLETION_ASSETS' || normalizedStatus === 'POST COMPLETION ASSETS') {
        return 'text-purple-600 font-medium';
    }

    // All other statuses are "in progress" states
    return 'text-blue-600 font-medium';
}
