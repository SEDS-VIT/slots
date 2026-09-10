import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import { registration } from "@/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/db"; 

export async function checkRegistrationStatus(lastName: string) {
    if (!lastName) return { isRegistered: false, slot: null };

    // Query the database for the matching last name (registrationNumber field)
    const result = await db
        .select()
        .from(registration)
        .where(eq(registration.registrationNumber, lastName))
        .limit(1);

    const record = result[0];

    if (record) {
        return { isRegistered: true, slot: record.slot };
    }

    return { isRegistered: false, slot: null };
}

export const Route = createFileRoute("/home")({
    // This guard ensures only authenticated users can access the page
    beforeLoad: async () => {
        const session = await getSession();
        if (!session) {
            throw redirect({ to: "/" });
        }
        return { user: session.user };
    },
    loader: async ({context}) => {
        const {user} = context;
        const nameParts = user.name?.trim().split(" ") || []
        const lastName = nameParts[nameParts.length - 1]
        const registrationData = await checkRegistrationStatus(lastName);
        return { lastName, registrationData }
    },
    component: ProfilePage,
});

function ProfilePage() {
    const { user } = Route.useRouteContext();
    const { lastName, registrationData } = Route.useLoaderData();
    const router = useRouter();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    // Push the user back to the login page immediately after sign out
                    router.navigate({ to: "/" });
                },
            },
        });
    };

    return (
        <main style={{ padding: "2rem", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
            <h1 style={{ borderBottom: "1px solid #ccc", paddingBottom: "0.5rem" }}>
                Student Profile
            </h1>

            <div style={{ margin: "1.5rem 0", lineHeight: "1.8" }}>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Extracted Last Name:</strong> {lastName}</p>
            </div>

            {/* 3. Conditionally Render based on DB results */}
            <div style={{ margin: "1.5rem 0" }}>
                {registrationData.isRegistered ? (
                    <div style={{ padding: "1rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                        <h3 style={{ margin: "0 0 0.5rem 0" }}>✅ Registration Confirmed</h3>
                        <p style={{ margin: 0 }}>You are registered in <strong>Slot {registrationData.slot == -1 ? "Not selected" : registrationData.slot}</strong>.</p>
                    </div>
                ) : (
                    <div style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                        <h3 style={{ margin: "0 0 0.5rem 0" }}>❌ Not Registered</h3>
                        <p style={{ margin: 0 }}>We couldn't find a registration matching your registration number: ({lastName}).</p>
                    </div>
                )}
            </div>

            <button
                onClick={handleLogout}
                style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: "bold",
                    cursor: "pointer"
                }}
            >
                Sign Out
            </button>
        </main>
    );
}

