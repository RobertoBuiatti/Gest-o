export type Unit = "kg" | "g" | "L" | "ml" | "un";

export const UNITS = {
	kg: { label: "Quilograma", type: "mass", factor: 1000 }, // factor to base (g)
	g: { label: "Grama", type: "mass", factor: 1 },
	L: { label: "Litro", type: "volume", factor: 1000 }, // factor to base (ml)
	ml: { label: "Mililitro", type: "volume", factor: 1 },
	un: { label: "Unidade", type: "unit", factor: 1 },
};

export function getCompatibleUnits(baseUnit: string): Unit[] {
	const unitData = UNITS[baseUnit as Unit];
	if (!unitData) return [baseUnit as Unit];

	return (Object.keys(UNITS) as Unit[]).filter(
		(u) => UNITS[u].type === unitData.type,
	);
}

export function convertToStockUnit(
	quantity: number,
	fromUnit: Unit,
	stockUnit: Unit,
): number {
	const fromData = UNITS[fromUnit];
	const toData = UNITS[stockUnit];

	if (!fromData || !toData || fromData.type !== toData.type) {
		return quantity; // Fallback or throw error
	}

	// Convert to base unit then to target unit
	// Example: 2 kg -> g: 2 * 1000 / 1 = 2000
	// Example: 500 g -> kg: 500 * 1 / 1000 = 0.5
	return (quantity * fromData.factor) / toData.factor;
}

export function formatUnit(quantity: number, unit: Unit): string {
	// Helper to allow smart formatting if needed later
	return `${quantity} ${unit}`;
}
