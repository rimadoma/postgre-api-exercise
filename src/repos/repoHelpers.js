export function keysToCamelCase(row) {
    return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
            key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()),
            value
        ])
    );
}
