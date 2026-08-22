import { ArrowRight, Clock3, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ProductPreview() {
  return (
    <section className="product-preview" aria-label="Example Napkin exercise">
      <aside className="preview-session">
        <p className="ui-label">Session</p>
        <h2>Revenue &amp; growth</h2>
        <div className="progress-track"><span /></div>
        <div className="preview-stats">
          <div><strong>8</strong><span>Question</span></div>
          <div><strong>12</strong><span>Points</span></div>
        </div>
        <div className="preview-streak"><Flame aria-hidden="true" /><span><small>Streak</small><strong>5 in a row</strong></span></div>
      </aside>
      <div className="preview-question">
        <div className="preview-meta">
          <span className="ui-label">Operating profit</span>
          <span className="preview-time"><Clock3 aria-hidden="true" /> 06:28</span>
        </div>
        <h2>Net sales are €240k. Variable costs are 60% of sales and fixed costs are €54k. What is operating profit?</h2>
        <p>Enter the resulting operating profit.</p>
        <label htmlFor="preview-answer">Your answer <span>in €k</span></label>
        <div className="preview-answer">
          <input id="preview-answer" value="42" readOnly tabIndex={-1} aria-label="Example answer" />
          <span>€k</span>
        </div>
        <Button tabIndex={-1}>Check answer <ArrowRight aria-hidden="true" /></Button>
      </div>
    </section>
  )
}
