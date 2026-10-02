import cron from "node-cron";
import { generateAlertsFromConsultations } from "../controllers/diseaseAlertController.js";

export const startCronJobs = () => {
  // Run every day at 3 AM
  cron.schedule("0 3 * * *", async () => {
    console.log("Running automatic disease alert generation...");
    try {
      await generateAlertsFromConsultations();
      console.log("Disease alert generation completed");
    } catch (error) {
      console.error("Error in automatic alert generation:", error);
    }
  });
};