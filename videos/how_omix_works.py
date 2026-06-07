from manim import *
import math

# ── Omix brand colors ──
OMIX_BG = "#0F0F10"
OMIX_PRIMARY = "#FF385C"    # Omix red
OMIX_WHITE = "#F5F5F5"
OMIX_DIM = "#666666"
OMIX_GREEN = "#25D366"      # WhatsApp green
OMIX_BLUE = "#58C4DD"

MONO = "Menlo"


class HowOmixWorks(Scene):
    """Looping animation showing the 3-step Omix flow: Browse → Chat → Meet"""

    def construct(self):
        self.camera.background_color = BG = OMIX_BG

        # ── Title ──
        title = Text("How Omix Works", font_size=42, color=OMIX_WHITE, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.6)
        self.play(Write(title), run_time=1.0)
        self.wait(0.5)

        # ── Card dimensions ──
        card_w, card_h = 2.8, 2.0
        card_y = -0.6
        spacing = 3.6
        xs = [-spacing, 0, spacing]

        cards = []
        icons_steps = []
        step_labels = []

        # ── Step data ──
        steps_data = [
            {
                "num": "1",
                "label": "BROWSE",
                "desc": "Search listings\nby category",
                "icon_chars": "🔍",
                "accent": OMIX_BLUE,
            },
            {
                "num": "2",
                "label": "CHAT",
                "desc": "Contact seller\nvia WhatsApp",
                "icon_chars": "💬",
                "accent": OMIX_GREEN,
            },
            {
                "num": "3",
                "label": "MEET",
                "desc": "Pay safely\nvia M-Pesa",
                "icon_chars": "🤝",
                "accent": OMIX_PRIMARY,
            },
        ]

        # ── Build cards ──
        for i, sd in enumerate(steps_data):
            card = RoundedRectangle(
                width=card_w, height=card_h, corner_radius=0.2,
                fill_color=OMIX_PRIMARY, fill_opacity=0.0,
                stroke_color=OMIX_DIM, stroke_width=2,
            )
            card.move_to([xs[i], card_y, 0])

            # Accent bar at top
            accent_bar = RoundedRectangle(
                width=card_w, height=0.06, corner_radius=0.03,
                fill_color=sd["accent"], fill_opacity=1.0,
                stroke_width=0,
            )
            accent_bar.next_to(card.get_top(), DOWN, buff=0.15)

            # Step number
            num = Text(sd["num"], font_size=56, color=sd["accent"], weight=BOLD, font=MONO)
            num.next_to(accent_bar.get_bottom(), DOWN, buff=0.25)

            # Step label
            label = Text(sd["label"], font_size=22, color=OMIX_WHITE, weight=BOLD, font=MONO)
            label.next_to(num, DOWN, buff=0.1)

            # Description
            desc = Text(sd["desc"], font_size=16, color=OMIX_DIM, font=MONO)
            desc.next_to(label, DOWN, buff=0.15)

            group = VGroup(card, accent_bar, num, label, desc)
            cards.append(group)

        # ── Connector arrows ──
        arrow1 = Arrow(
            start=cards[0].get_right() + 0.1 * RIGHT,
            end=cards[1].get_left() - 0.1 * LEFT,
            buff=0, color=OMIX_DIM, stroke_width=3, tip_length=0.15,
        )
        arrow2 = Arrow(
            start=cards[1].get_right() + 0.1 * RIGHT,
            end=cards[2].get_left() - 0.1 * LEFT,
            buff=0, color=OMIX_DIM, stroke_width=3, tip_length=0.15,
        )

        # ── Animate cards in sequence ──
        self.play(
            LaggedStart(
                FadeIn(cards[0], shift=UP * 0.3),
                FadeIn(cards[1], shift=UP * 0.3),
                FadeIn(cards[2], shift=UP * 0.3),
                lag_ratio=0.35,
            ),
            run_time=2.5,
        )
        self.wait(0.5)

        # ── Animate arrows ──
        self.play(GrowArrow(arrow1), run_time=0.6)
        self.play(GrowArrow(arrow2), run_time=0.6)
        self.wait(1.0)

        # ── Pulse each card in sequence (loop segment) ──
        for idx in range(3):
            orig_stroke = cards[idx][0].get_stroke_color()
            cards[idx][0].save_state()
            self.play(
                cards[idx][0].animate.set_stroke(color=steps_data[idx]["accent"], width=4),
                run_time=0.4,
            )
            self.wait(1.2)
            self.play(
                cards[idx][0].animate.set_stroke(color=OMIX_DIM, width=2),
                run_time=0.4,
            )

        # ── Fade everything to prepare for loop ──
        all_elements = VGroup(title, *cards, arrow1, arrow2)
        self.wait(0.5)

        # ── Loop: entire sequence plays, then cross-dissolves back to start ──
        # We achieve this by fading out and replaying
        self.add(title)  # keep title static
        loop_group = VGroup(*cards, arrow1, arrow2)

        # Shrink cards to center then expand back — seamless loop point
        self.play(
            loop_group.animate.scale(0.01, about_point=self.camera_frame_center),
            run_time=0.8,
        )

        # Reset cards
        self.remove(cards[0], cards[1], cards[2], arrow1, arrow2)

        # Rebuild fresh cards for loop continuation
        cards2 = []
        for i, sd in enumerate(steps_data):
            card = RoundedRectangle(
                width=card_w, height=card_h, corner_radius=0.2,
                fill_color=OMIX_PRIMARY, fill_opacity=0.0,
                stroke_color=OMIX_DIM, stroke_width=2,
            )
            card.move_to([xs[i], card_y, 0])
            accent_bar = RoundedRectangle(
                width=card_w, height=0.06, corner_radius=0.03,
                fill_color=sd["accent"], fill_opacity=1.0, stroke_width=0,
            )
            accent_bar.next_to(card.get_top(), DOWN, buff=0.15)
            num = Text(sd["num"], font_size=56, color=sd["accent"], weight=BOLD, font=MONO)
            num.next_to(accent_bar.get_bottom(), DOWN, buff=0.25)
            label = Text(sd["label"], font_size=22, color=OMIX_WHITE, weight=BOLD, font=MONO)
            label.next_to(num, DOWN, buff=0.1)
            desc = Text(sd["desc"], font_size=16, color=OMIX_DIM, font=MONO)
            desc.next_to(label, DOWN, buff=0.15)
            group = VGroup(card, accent_bar, num, label, desc)
            group.scale(0.01)
            cards2.append(group)

        arrow1_new = Arrow(
            start=cards2[0].get_right() + 0.1 * RIGHT,
            end=cards2[1].get_left() - 0.1 * LEFT,
            buff=0, color=OMIX_DIM, stroke_width=3, tip_length=0.15,
        ).scale(0.01)
        arrow2_new = Arrow(
            start=cards2[1].get_right() + 0.1 * RIGHT,
            end=cards2[2].get_left() - 0.1 * LEFT,
            buff=0, color=OMIX_DIM, stroke_width=3, tip_length=0.15,
        ).scale(0.01)

        self.add(*cards2, arrow1_new, arrow2_new)

        loop_group2 = VGroup(*cards2, arrow1_new, arrow2_new)
        self.play(
            loop_group2.animate.scale(100, about_point=self.camera_frame_center),
            run_time=1.0,
        )

        # Pulse sequence again
        for idx in range(3):
            self.play(
                cards2[idx][0].animate.set_stroke(color=steps_data[idx]["accent"], width=4),
                run_time=0.4,
            )
            self.wait(1.2)
            self.play(
                cards2[idx][0].animate.set_stroke(color=OMIX_DIM, width=2),
                run_time=0.4,
            )

        self.wait(2.0)

        # Fade out for clean end
        self.play(
            FadeOut(loop_group2),
            run_time=0.8,
        )
        self.wait(0.5)
