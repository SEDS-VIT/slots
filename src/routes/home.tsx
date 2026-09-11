import { v7 as uuidv7 } from 'uuid';
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { getSession } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import { registration, slot, bookings } from "@/db/schema";
import { eq, sql, count, asc } from "drizzle-orm";
import { db } from "@/db";
import { useState } from 'react';

// 1. PURE SERVER FUNCTION (No React State Setters allowed here)
export async function handleSlotDB(slotId: number, userId: string) {
    const users = await db.select().from(bookings).where(eq(bookings.userId, userId));
    const user = users[0];

    const curCap = await db.select({ count: count() }).from(bookings).where(eq(bookings.slot, slotId));
    const maxCap = await db.select({ count: slot.maxCapacity }).from(slot).where(eq(slot.id, slotId));

    const capacity = maxCap[0]?.count ?? 195;

    // If full, return false to the frontend
    if (curCap[0].count >= capacity) {
        return false;
    }

    const uuid = uuidv7();
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
    ).returning();

    const valid = insertedBooking.length > 0

    if (valid) {
        if (user != null) {
            await db.delete(bookings).
                where(
                    eq(
                        bookings.id, user.id
                    )
                );
        }

    }

    // Return true if insertion succeeded
    return valid;
}

export async function checkCapacity() {
    const slot1 = await db.select({ count: count() }).from(bookings).where(eq(bookings.slot, 1));
    const slot2 = await db.select({ count: count() }).from(bookings).where(eq(bookings.slot, 2));
    const slot3 = await db.select({ count: count() }).from(bookings).where(eq(bookings.slot, 3));
    const maxCap = await db.select({ count: slot.maxCapacity }).from(slot).orderBy(asc(slot.id));
    const slot1Max = maxCap[0]?.count ?? 195;
    const slot2Max = maxCap[1]?.count ?? 195;
    const slot3Max = maxCap[2]?.count ?? 195;
    return [slot1Max - slot1[0].count, slot2Max - slot2[0].count, slot3Max - slot3[0].count]
}

export async function checkRegistrationStatus(regNo: string, userId: string) {
    if (!regNo) return { isRegistered: false, slot: null };

    const result = await db.select().from(registration).where(eq(registration.registrationNumber, regNo)).limit(1);
    const record = result[0];

    let registered: boolean = false;
    let userSlot = null;

    if (record) {
        registered = true;
        const resultSlot = await db.select({ slot: bookings.slot }).from(bookings).where(eq(bookings.userId, userId));
        userSlot = resultSlot?.[0]?.slot ?? null;
    }

    return { isRegistered: registered, slot: userSlot, userId };
}

export const Route = createFileRoute("/home")({
    beforeLoad: async () => {
        const session = await getSession();
        if (!session) {
            throw redirect({ to: "/" });
        }
        return { user: session.user };
    },
    loader: async ({ context }) => {
        const { user } = context;
        const nameParts = user.name?.trim().split(" ") || [];
        const lastName = nameParts[nameParts.length - 1];
        const registrationData = await checkRegistrationStatus(lastName, user.id);
        const slotCapacities = await checkCapacity();
        return { lastName, registrationData, slotCapacities };
    },
    component: ProfilePage,
});

function ProfilePage() {
    const { user } = Route.useRouteContext();
    const { lastName, registrationData, slotCapacities } = Route.useLoaderData();
    const router = useRouter();

    const [accepted, setAccepted] = useState<boolean | null>(null);
    const [currentSlot, setCurrentSlot] = useState<number | null>(registrationData.slot);
    const [isPending, setIsPending] = useState(false);
    const [slotCapacity, setSlotCapacity] = useState(slotCapacities);

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => router.navigate({ to: "/" }),
            },
        });
    };

    // 2. CLIENT HANDLER (Calls the DB function and updates React State)
    const onSlotSelect = async (slotId: number) => {
        setIsPending(true);
        try {
            // Wait for the server function to finish
            const success = await handleSlotDB(slotId, user.id);

            if (success) {
                setAccepted(true);
                setCurrentSlot(slotId);
            } else {
                setAccepted(false);
            }
        } catch (error) {
            setAccepted(false);
        } finally {
            setIsPending(false);
        }
        const caps = await checkCapacity();
        setSlotCapacity(caps);
    };

    return (
        <>
            <style>{`
        /* SEDS-Inspired Aerospace Theme */
        .space-bg {
            min-height: 100vh;
            /* Deep space black with a subtle mission-control grid overlay */
            background-color: #030712;
            background-image: 
                linear-gradient(rgba(79, 70, 229, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(79, 70, 229, 0.05) 1px, transparent 1px),
                radial-gradient(circle at top right, rgba(30, 27, 75, 0.8), #030712 60%);
            background-size: 30px 30px, 30px 30px, 100% 100%;
            color: #e2e8f0;
            font-family: 'Inter', system-ui, sans-serif;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 4rem 1rem;
        }
        
        .glass-panel {
            background: rgba(15, 23, 42, 0.6);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-top: 2px solid rgba(99, 102, 241, 0.5); /* HUD highlight */
            border-radius: 16px;
            padding: 2.5rem;
            width: 100%;
            max-width: 600px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            position: relative;
        }

        .neon-title {
            font-size: 1.8rem;
            font-weight: 800;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 1.5rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
            padding-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .info-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 2rem;
        }
        
        .info-row {
            background: rgba(3, 7, 18, 0.4);
            padding: 1rem;
            border-radius: 8px;
            border-left: 3px solid #4f46e5; /* Technical accent line */
            display: flex;
            flex-direction: column;
        }

        .info-label {
            color: #818cf8;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 0.35rem;
            font-weight: 600;
        }
        
        .info-value {
            color: #f8fafc;
            font-weight: 500;
            font-size: 1rem;
            word-break: break-all;
        }

        .status-box {
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            background: rgba(3, 7, 18, 0.6);
        }

        .status-success {
            border: 1px solid rgba(16, 185, 129, 0.3);
            box-shadow: inset 0 0 20px rgba(16, 185, 129, 0.05);
        }

        .status-error {
            border: 1px solid rgba(239, 68, 68, 0.3);
            box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.05);
        }

        .btn-container {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }

        .cyber-btn {
            flex: 1;
            padding: 0.85rem;
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid #4f46e5;
            color: #c7d2fe;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9rem;
        }

        .cyber-btn:hover:not(:disabled) {
            background: #4f46e5;
            color: #fff;
            box-shadow: 0 0 15px rgba(79, 70, 229, 0.4);
        }

        .cyber-btn.active {
            background: #10b981;
            border-color: #059669;
            color: #fff;
            box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
        }
        
        .cyber-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .logout-btn {
            width: 100%;
            padding: 1rem;
            background: rgba(220, 38, 38, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.4);
            color: #fca5a5;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 0.9rem;
        }

        .logout-btn:hover {
            background: rgba(220, 38, 38, 0.2);
            color: #fff;
        }
        
        .glow-text-green { color: #34d399; font-size: 0.9rem; margin-top: 1rem; }
        .glow-text-red { color: #f87171; font-size: 0.9rem; margin-top: 1rem; }

        /* --- MOBILE RESPONSIVE MEDIA QUERIES --- */
        @media (max-width: 640px) {
            .space-bg {
                padding: 1rem 0.5rem; /* Less padding on the edges */
            }
            
            .glass-panel {
                padding: 1.5rem 1rem; /* Tighter padding inside the card */
                border-radius: 12px;
            }

            .neon-title {
                font-size: 1.3rem; /* Smaller title */
                margin-bottom: 1.25rem;
            }

            .info-row {
                padding: 0.75rem; /* Tighter info rows */
            }

            .btn-container {
                flex-direction: column; /* Stack buttons vertically */
                gap: 0.75rem;
            }

            .cyber-btn {
                width: 100%;
                padding: 1rem; /* Larger touch target for thumbs */
                font-size: 1rem;
            }

            .status-box {
                padding: 1rem; /* Tighter status box */
            }
        }
    `}</style>

            <main className="space-bg">
                <div className="glass-panel">
                    <h1 className="neon-title">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#818cf8" }}>
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        Mission Console
                    </h1>

                    <div className="info-grid">
                        <div className="info-row">
                            <span className="info-label">Operative Designation</span>
                            <span className="info-value">{user.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Secure Channel</span>
                            <span className="info-value">{user.email}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Callsign</span>
                            <span className="info-value">{lastName}</span>
                        </div>
                    </div>

                    {registrationData.isRegistered ? (
                        <div className="status-box status-success">
                            <h3 style={{ margin: "0 0 0.5rem 0", color: "#34d399", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>●</span> Authentication Valid
                            </h3>

                            <p style={{ margin: "0 0 1rem 0", color: "#94a3b8", fontSize: "0.95rem" }}>
                                Active Trajectory: <strong style={{ color: "#fff" }}>Slot {currentSlot == null ? "Pending" : currentSlot}</strong>
                            </p>

                            <div className="btn-container">
                                {[1, 2, 3].map((slotNum) => {
                                    // 1. Array index fix for capacities
                                    const remainingSeats = slotCapacity[slotNum - 1];
                                    const isFull = remainingSeats <= 0;

                                    // 2. Map the slot number to your specific dates
                                    const dateMap: Record<number, string> = {
                                        1: "18th",
                                        2: "19th",
                                        3: "20th"
                                    };
                                    const slotDate = dateMap[slotNum];

                                    return (
                                        <button
                                            key={slotNum}
                                            onClick={() => onSlotSelect(slotNum)}
                                            disabled={isPending || (isFull && currentSlot !== slotNum)}
                                            className={`cyber-btn ${currentSlot === slotNum ? 'active' : ''}`}
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "6px",
                                                padding: "1rem 0.5rem"
                                            }}
                                        >
                                            {/* Date Label (Looks like a technical timestamp) */}
                                            <span style={{
                                                fontSize: "0.7rem",
                                                color: currentSlot === slotNum ? "#d1fae5" : "#818cf8",
                                                letterSpacing: "1.5px"
                                            }}>
                                                WINDOW: {slotDate}
                                            </span>

                                            {/* Main Button Text */}
                                            <span style={{ fontSize: "1.05rem" }}>
                                                SLOT {slotNum}
                                            </span>

                                            {/* HUD Sub-label for capacity */}
                                            <span style={{
                                                fontSize: "0.7rem",
                                                letterSpacing: "1px",
                                                color: currentSlot === slotNum ? "#fff" : (isFull ? "#f87171" : "#6366f1"),
                                                fontWeight: "bold"
                                            }}>
                                                {isFull ? "SECTOR FULL" : `CAPACITY: ${remainingSeats}`}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div style={{ minHeight: "24px", marginTop: "1rem" }}>
                                {isPending && <p style={{ color: "#818cf8", margin: 0, fontSize: "0.9rem" }}>Aligning coordinates...</p>}
                                {accepted === true && <p className="glow-text-green">Transmission logged. Trajectory locked.</p>}
                                {accepted === false && <p className="glow-text-red">Access denied. Sector capacity exceeded.</p>}
                            </div>
                        </div>
                    ) : (
                        <div className="status-box status-error">
                            <h3 style={{ margin: "0 0 0.5rem 0", color: "#f87171", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
                                <span style={{ fontSize: "1.2rem" }}>▲</span> Unregistered Entity
                            </h3>
                            <p style={{ margin: 0, color: "#fca5a5", lineHeight: "1.5", fontSize: "0.95rem" }}>
                                No flight clearance found for identifier: <strong>{lastName}</strong>.<br /><br />
                                Establish contact with Commander Jishnu Suresh at +91 6282 575 690 to override.
                            </p>
                        </div>
                    )}

                    <button onClick={handleLogout} className="logout-btn">
                        Terminate Connection
                    </button>
                </div>
            </main>
        </>
    );
}
