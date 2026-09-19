import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { getSession } from "@/lib/auth.functions";
import { authClient } from "@/lib/auth-client";
import { db } from '#/db';
import { bookings, registration } from '#/db/schema';
import { eq } from 'drizzle-orm';

// 1. Instantiate the QueryClient outside the component to prevent recreation on re-renders
const queryClient = new QueryClient();

// Configure the Google Drive links per slot
const SLOT_DRIVE_LINKS: Record<number, string> = {
    1: "https://drive.google.com/drive/folders/18k5DQTxiz8gOo-8dpoeHhZmp0fm8hZ1h",
    2: "https://drive.google.com/drive/folders/1TGTb5FJS8OUlpERoAx71vWDtqjMAzeR-",
    3: "https://drive.google.com/drive/folders/1aTupwLtYwLRv5TcoA52kYrXMlZoYKqz5",
};

// Server-side function to handle DB queries securely
export async function fetchMissionStatus(lastName: string, userId: string) {
    const regRecord = await db
        .select()
        .from(registration)
        .where(eq(registration.registrationNumber, lastName))
        .limit(1);

    if (regRecord.length === 0) {
        return { isRegistered: false, slot: null };
    }

    const bookingRecord = await db
        .select({ slot: bookings.slot })
        .from(bookings)
        .where(eq(bookings.userId, userId))
        .limit(1);

    // Return the assigned slot, defaulting to 3 if null/undefined
    const assignedSlot = bookingRecord[0]?.slot ?? 3;

    return { isRegistered: true, slot: assignedSlot };
}

export const Route = createFileRoute('/home')({
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
        const lastName = nameParts[nameParts.length - 1] || "";

        return { lastName, userId: user.id };
    },
    // 2. Wrap the RouteComponent with the Provider at the Route definition level
    component: () => (
        <QueryClientProvider client={queryClient}>
            <MissionConsole />
        </QueryClientProvider>
    ),
});

function MissionConsole() {
    const { user } = Route.useRouteContext();
    const { lastName, userId } = Route.useLoaderData();
    const router = useRouter();

    const { data: missionData, isLoading } = useQuery({
        queryKey: ['missionStatus', userId, lastName],
        queryFn: () => fetchMissionStatus(lastName, userId),
    });

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => router.navigate({ to: "/" }),
            },
        });
    };

    const driveLink = missionData?.slot ? SLOT_DRIVE_LINKS[missionData.slot] : null;

    return (
        <main className="min-h-screen bg-[#030712] text-slate-200 font-sans flex justify-center items-start pt-16 px-4 pb-16 sm:px-4 bg-[image:linear-gradient(rgba(79,70,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.05)_1px,transparent_1px),radial-gradient(circle_at_top_right,rgba(30,27,75,0.8),#030712_60%)] bg-[length:30px_30px,30px_30px,100%_100%]">
            <div className="bg-slate-900/60 backdrop-blur-md border border-indigo-500/20 border-t-2 border-t-indigo-500/50 rounded-2xl p-6 sm:p-10 w-full max-w-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] relative">

                <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-[3px] mb-6 border-b border-dashed border-white/15 pb-4 flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Mission Console
                </h1>

                <div className="flex flex-col gap-3 mb-8">
                    <div className="bg-gray-950/40 p-4 rounded-lg border-l-[3px] border-indigo-600 flex flex-col">
                        <span className="text-indigo-400 text-xs uppercase tracking-[1.5px] mb-1 font-semibold">Operative Designation</span>
                        <span className="text-slate-50 font-medium text-base break-all">{user.name.split(" ").slice(0, -1).join(" ")}</span>
                    </div>
                    <div className="bg-gray-950/40 p-4 rounded-lg border-l-[3px] border-indigo-600 flex flex-col">
                        <span className="text-indigo-400 text-xs uppercase tracking-[1.5px] mb-1 font-semibold">Secure Channel</span>
                        <span className="text-slate-50 font-medium text-base break-all">{user.email}</span>
                    </div>
                    <div className="bg-gray-950/40 p-4 rounded-lg border-l-[3px] border-indigo-600 flex flex-col">
                        <span className="text-indigo-400 text-xs uppercase tracking-[1.5px] mb-1 font-semibold">Callsign</span>
                        <span className="text-slate-50 font-medium text-base break-all">{lastName}</span>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-6 rounded-xl mb-8 bg-gray-950/60 border border-indigo-500/30 flex justify-center items-center h-[120px]">
                        <span className="text-indigo-400 animate-pulse font-semibold uppercase tracking-widest text-sm">Aligning coordinates...</span>
                    </div>
                ) : missionData?.isRegistered ? (
                    <>
                        <div className="p-6 rounded-xl mb-8 bg-gray-950/60 border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                            <h3 className="m-0 mb-2 text-emerald-400 flex items-center gap-2 text-lg font-semibold">
                                <span className="text-xl">●</span> Authentication Valid
                            </h3>
                            <p className="m-0 mb-4 text-slate-400 text-sm">
                                Active Trajectory: <strong className="text-white">Slot {missionData.slot}</strong>
                            </p>
                        </div>

                        {/* Direct Slot-based Drive Link Section */}
                        <div className="mb-8 bg-gray-950/60 border border-blue-500/30 border-l-[3px] border-l-blue-500 rounded-xl p-6">
                            <h3 className="m-0 mb-2 text-blue-400 text-lg flex items-center gap-2 font-semibold">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                                Event Archives
                            </h3>
                            <p className="m-0 mb-5 text-slate-400 text-sm leading-relaxed">
                                Access the secure photo gallery calibrated for <strong className="text-white">Slot {missionData.slot}</strong>.
                            </p>

                            {driveLink ? (
                                <a
                                    href={driveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full inline-flex justify-center items-center gap-2 px-6 py-4 bg-blue-500/10 border border-blue-500/50 text-blue-300 rounded-lg font-bold tracking-wide uppercase text-sm transition-all duration-200 hover:bg-blue-500/25 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] no-underline"
                                >
                                    Open Slot {missionData.slot} Drive Gallery
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </a>
                            ) : (
                                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded text-red-300 text-xs">
                                    No archive link configured for assigned slot.
                                </div>
                            )}
                        </div>

                        <div className="mb-8 bg-gray-950/60 border border-green-500/30 border-l-[3px] border-l-green-500 rounded-xl p-6">
                            <h3 className="m-0 mb-2 text-green-400 text-lg flex items-center gap-2 font-semibold">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                                </svg>
                                Crew Channel Open
                            </h3>
                            <p className="m-0 mb-5 text-slate-400 text-sm leading-relaxed">
                                Join the official WhatsApp group for event updates, rooftop briefings, and live announcements.
                            </p>
                            <a
                                href="https://chat.whatsapp.com/K9PO55xb0c8EzrrEqXWxsf?s=cl&p=a&mlu=4&ilr=4"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/50 text-green-300 rounded-lg font-bold tracking-wide uppercase text-sm transition-all duration-200 hover:bg-green-500/25 hover:text-white hover:shadow-[0_0_15px_rgba(37,211,102,0.3)] no-underline"
                            >
                                Join WhatsApp Group
                            </a>
                        </div>
                    </>
                ) : (
                    <div className="p-6 rounded-xl mb-8 bg-gray-950/60 border border-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]">
                        <h3 className="m-0 mb-2 text-red-400 flex items-center gap-2 text-lg font-semibold">
                            <span className="text-xl">▲</span> Unregistered Entity
                        </h3>
                        <p className="m-0 text-red-300 leading-relaxed text-sm">
                            No flight clearance found for identifier: <strong className="text-white">{lastName}</strong>.<br /><br />
                            Establish contact with Commander Jishnu Suresh at +91 6282 575 690 to override.
                        </p>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="w-full p-4 bg-red-600/10 border border-red-500/40 text-red-300 rounded-lg font-semibold uppercase tracking-[2px] text-sm transition-all duration-200 hover:bg-red-600/20 hover:text-white cursor-pointer"
                >
                    Terminate Connection
                </button>
            </div>
        </main>
    );
}
