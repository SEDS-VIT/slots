import { v7 as uuidv7 } from 'uuid'
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import { registration, slot, bookings } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { db } from "@/db";
import { useState } from 'react';

export async function handleSlot(slotId: number, userId: string, setAccepted: CallableFunction, setSlot: CallableFunction) {
    const users = await db.select().from(bookings).where(eq(bookings.userId, userId));
    const user = users[0];
    const curCap = await db.select({count: count()}).from(bookings).where(eq(bookings.slot, slotId))
    const maxCap = await db.select({count: slot.maxCapacity}).from(slot).where(eq(slot.id, slotId))
    const capacity = maxCap[0]?.count ?? 195;
    if ( curCap[0].count >= capacity){
        setAccepted(false);
        return
    }
    if (user != null) {
        await db.delete(bookings).where(eq(bookings.userId, userId));
    }
    const uuid = uuidv7()
    const insertedBooking = await db.insert(bookings).select(
        db.select({
            id: sql`${uuid}`,
            userId: sql`${userId}`,
            slot: slot.id,
        })
            .from(slot)
            .leftJoin(bookings, eq(bookings.slot, slot.id))
            .where(eq(slot.id, slotId))
            .groupBy(slot.id, slot.maxCapacity)
            .having(sql`count(${bookings.id}) < ${slot.maxCapacity}`)
    )
        .returning(); // <-- Add this here
    setAccepted(insertedBooking != null);
    setSlot(slotId);

}

export async function checkCapacity() {
    const result = await db.select().from(slot);
    return result;
}

export async function checkRegistrationStatus(regNo: string, userId: string) {
    if (!regNo) return { isRegistered: false, slot: null };

    // Query the database for the matching last name (registrationNumber field)
    const result = await db
        .select()
        .from(registration)
        .where(eq(registration.registrationNumber, regNo))
        .limit(1);

    const record = result[0];
    let registered: boolean = false;
    let slot = null;

    if (record) {
        registered = true;
        const resultSlot = await db.select({ slot: bookings.slot }).from(bookings).where(eq(bookings.userId, userId))
        slot = resultSlot?.[0]?.slot ?? null;
    }

    return { isRegistered: registered, slot, userId };
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
    loader: async ({ context }) => {
        const { user } = context;
        const nameParts = user.name?.trim().split(" ") || []
        const lastName = nameParts[nameParts.length - 1]
        const registrationData = await checkRegistrationStatus(lastName, user.id);
        const slotCapacities = await checkCapacity();
        return { lastName, registrationData, slotCapacities }
    },
    component: ProfilePage,
});

function ProfilePage() {
    const { user } = Route.useRouteContext();
    const { lastName, registrationData } = Route.useLoaderData();
    const router = useRouter();
    const [accepted, setAccepted] = useState<boolean | null>(null);
    const [slot, setSlot] = useState<number | null>(registrationData.slot);

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
                    <>
                    <div style={{ padding: "1rem", backgroundColor: "#dcfce7", color: "#166534", borderRadius: "0.5rem", border: "1px solid #bbf7d0" }}>
                        <h3 style={{ margin: "0 0 0.5rem 0" }}>✅ Registration Confirmed</h3>
                        <p style={{ margin: 0 }}>You are registered in <strong>Slot {slot == null ? "Not selected" : slot}</strong>.</p>
                        {slot == null ? (
                            <p>You have not yet chosen a slot</p>
                        ) : (
                            <p>You have registered in slot: {slot}</p>
                        )
                        }
                        <button
                            onClick={() => handleSlot(1, user.id, setAccepted, setSlot)}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: slot === 1 ? "2px solid green" : "none",
                                borderRadius: "0.375rem",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >Slot 1</button>
                        <button
                            onClick={() => handleSlot(2, user.id, setAccepted, setSlot)}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: slot === 2 ? "2px solid green" : "none",
                                borderRadius: "0.375rem",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >Slot 2</button>
                        <button
                            onClick={() => handleSlot(3, user.id, setAccepted, setSlot)}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#ef4444",
                                color: "white",
                                border: slot === 3 ? "2px solid green" : "none",
                                borderRadius: "0.375rem",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >Slot 3</button>
                    </div>
                    {accepted === true && <p>Slot selected successfully</p>}

                    {accepted === false && <p>Slot could not be properly selected</p>}
                    </>
                ) : (
                <div style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                    <h3 style={{ margin: "0 0 0.5rem 0" }}>❌ Not Registered</h3>
                    <p style={{ margin: 0 }}>We couldn't find a registration matching your registration number: ({lastName}). Contact John Smith at 9876543210 by phone or whatsapp for queries</p>
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

