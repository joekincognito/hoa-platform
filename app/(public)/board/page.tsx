import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Board & committee members",
};

export default async function BoardPage() {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from("board_members")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-destructive">
        Failed to load board members.
      </div>
    );
  }

  const officers = members.filter((m) => m.role && !m.committee);
  const byCommittee: Record<string, typeof members> = {};
  for (const m of members) {
    if (m.committee) {
      (byCommittee[m.committee] ??= []).push(m);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Board &amp; committee members
        </h1>
        <p className="mt-3 text-muted-foreground">
          Volunteers who keep the community running.
        </p>
      </header>

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 p-16 text-center text-muted-foreground">
          No active board members listed.
        </div>
      ) : (
        <div className="space-y-12">
          {officers.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Officers
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {officers.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border bg-card p-5 shadow-sm"
                  >
                    <p className="font-semibold">{m.name}</p>
                    {m.role && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {m.role}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {Object.entries(byCommittee).map(([name, list]) => (
            <section key={name}>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {name}
              </h2>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border bg-card p-5 shadow-sm"
                  >
                    <p className="font-semibold">{m.name}</p>
                    {m.role && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {m.role}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
