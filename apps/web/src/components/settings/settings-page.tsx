import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { NapkinIdentity } from "@/components/brand/napkin-identity"
import { GoogleIcon } from "@/components/ui/google-icon"
import { Button } from "@/components/ui/button"
import { updateDisplayName, useAuth } from "@/features/auth/auth-store"

export function SettingsPage() {
  const { user } = useAuth()
  const currentName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""
  const [name, setName] = useState<string>(currentName)
  const save = useMutation({ mutationFn: updateDisplayName })
  return <main className="settings-shell">
    <div className="settings-page">
      <header><NapkinIdentity href="/home" /><Link to="/home"><ArrowLeft aria-hidden="true" /> Back home</Link></header>
      <section className="settings-card account-settings" aria-labelledby="settings-title">
        <h1 id="settings-title">Your account.</h1>
        <p>A few details. Back to practice.</p>
        <form onSubmit={event => { event.preventDefault(); if (name.trim()) save.mutate(name.trim()) }}>
          <label htmlFor="display-name">Name</label>
          <input id="display-name" autoComplete="name" maxLength={80} required value={name} disabled={save.isPending} onChange={event => { setName(event.target.value); save.reset() }} />
          <div className="account-sign-in">
            <span className="account-provider"><GoogleIcon /> Signed in with Google</span>
            <p>{user?.email}</p>
          </div>
          <Button type="submit" disabled={save.isPending || !name.trim() || name.trim() === currentName}>{save.isPending ? "Saving…" : "Save changes"}</Button>
          {save.isError && <p role="alert">Could not save your name. Please try again.</p>}
          {save.isSuccess && <p role="status">Saved.</p>}
        </form>
      </section>
    </div>
  </main>
}
