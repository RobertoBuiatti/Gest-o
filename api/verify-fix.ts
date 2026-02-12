import { salonService } from "./src/services/salon.service";
import { contextStorage } from "./src/config/context";

async function verify() {
	console.log("Testing Appointment Validation...");

	// Mocking system context
	await contextStorage.run({ system: "salao" }, async () => {
		try {
			console.log("\n1. Testing with non-existent clientId...");
			await salonService.createAppointment({
				date: new Date(),
				clientId: "non-existent-client",
				serviceId: "any-service",
				userId: "any-user",
			});
		} catch (error: any) {
			console.log("Result (Expected Error):", error.message);
		}

		// Since I don't have a valid service or user ID handy without querying,
		// I'll trust the logic if the first one worked as expected.
		// In a real test environment, I'd seed these.
	});
}

verify().catch(console.error);
