import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminLoginSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            <Skeleton className="h-8 w-3/4 mx-auto" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-sm">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="mt-4 text-center text-sm">
            <Skeleton className="h-6 w-40 mx-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
