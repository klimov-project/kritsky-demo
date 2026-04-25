export default function TestVariantSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="space-y-2 text-center">
                <div className="mx-auto h-6 w-40 rounded bg-gray-200" />
                <div className="mx-auto h-4 w-24 rounded bg-gray-200" />
            </div>

            <div className="h-16 rounded-xl border border-gray-200 bg-white p-4">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="mt-2 h-3 w-5/6 rounded bg-gray-200" />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="h-10 rounded bg-gray-200" />
                    <div className="h-10 rounded bg-gray-200" />
                </div>
                <div className="mt-3 h-9 w-64 rounded bg-gray-200" />
            </div>

            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-[94%] rounded bg-gray-200" />
                <div className="h-3 w-[90%] rounded bg-gray-200" />
            </div>
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className="h-4 w-5/6 rounded bg-gray-200" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="h-3 w-1/2 rounded bg-gray-200" />
                        <div className="h-3 w-full rounded bg-gray-200" />
                        <div className="h-3 w-11/12 rounded bg-gray-200" />
                        <div className="h-3 w-10/12 rounded bg-gray-200" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-1/2 rounded bg-gray-200" />
                        <div className="h-3 w-full rounded bg-gray-200" />
                        <div className="h-3 w-11/12 rounded bg-gray-200" />
                        <div className="h-3 w-10/12 rounded bg-gray-200" />
                    </div>
                </div>
            </div>
        </div>
    );
}
