export type Unit = "kg" | "g" | "L" | "ml" | "un";

export const UNITS: Record<
	Unit,
	{ label: string; type: "mass" | "volume" | "unit"; factor: number }
> = {
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
		return quantity; // Fallback
	}

	// Convert to base unit then to target unit
	return (quantity * fromData.factor) / toData.factor;
}
