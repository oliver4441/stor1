from manim import *

# ── Omix brand colors ──
OMIX_BG = "#0F0F10"
OMIX_PRIMARY = "#FF385C"
OMIX_WHITE = "#F5F5F5"
OMIX_DIM = "#666666"
OMIX_GREEN = "#25D366"
OMIX_BLUE = "#58C4DD"
OMIX_AMBER = "#F59E0B"

MONO = "Menlo"


class BuyAndSellKericho(Scene):
    """Looping animation: Buy and Sell in Kericho — marketplace coming alive"""

    def construct(self):
        self.camera.background_color = BG = OMIX_BG

        # ── Title ──
        title = Text("Buy & Sell in Kericho", font_size=40, color=OMIX_WHITE, weight=BOLD, font=MONO)
        title.to_edge(UP, buff=0.5)
        self.play(Write(title), run_time=1.0)
        self.wait(0.3)

        # ── Center: location pin + Kericho text ──
        pin = SVGMobject()
        # Draw a simple pin shape using manim primitives
        pin_circle = Circle(radius=0.35, color=OMIX_PRIMARY, fill_opacity=1.0, fill_color=OMIX_PRIMARY)
        pin_triangle = Polygon(
            [-0.25, 0, 0], [0.25, 0, 0], [0, -0.35, 0],
            color=OMIX_PRIMARY, fill_opacity=1.0, fill_color=OMIX_PRIMARY,
        )
        pin_inner = Circle(radius=0.12, color=OMIX_BG, fill_opacity=1.0, fill_color=OMIX_BG)
        pin_group = VGroup(pin_circle, pin_triangle, pin_inner)
        pin_group.move_to([0, 0.8, 0])

        kericho = Text("Kericho, Kenya", font_size=28, color=OMIX_WHITE, font=MONO)
        kericho.next_to(pin_group, DOWN, buff=0.3)

        self.play(
            GrowFromCenter(pin_group),
            FadeIn(kericho, shift=UP * 0.2),
            run_time=1.0,
        )
        self.wait(0.5)

        # ── Floating category icons around the pin ──
        categories = [
            {"label": "Electronics", "color": OMIX_BLUE, "angle": 150, "dist": 2.8},
            {"label": "Furniture", "color": OMIX_AMBER, "angle": 30, "dist": 2.8},
            {"label": "Clothing", "color": OMIX_GREEN, "angle": 210, "dist": 2.8},
            {"label": "Services", "color": OMIX_PRIMARY, "angle": 330, "dist": 2.8},
        ]

        cat_groups = []
        for cat in categories:
            angle_rad = math.radians(cat["angle"])
            x = math.cos(angle_rad) * cat["dist"]
            y = math.sin(angle_rad) * cat["dist"] + 0.2

            dot = Dot(radius=0.12, color=cat["color"])
            dot.move_to([x, y, 0])

            label = Text(cat["label"], font_size=16, color=cat["color"], font=MONO)
            label.next_to(dot, direction=UP * 0.5 + RIGHT * 0.3, buff=0.2)

            # Connecting line to center
            line = DashedLine(
                start=[0, 0.5, 0], end=[x, y, 0],
                color=cat["color"], stroke_width=1.5, dash_length=0.1,
            )

            g = VGroup(line, dot, label)
            cat_groups.append(g)

        # ── Animate categories appearing ──
        self.play(
            LaggedStart(
                *[FadeIn(cg, shift=UP * 0.2) for cg in cat_groups],
                lag_ratio=0.3,
            ),
            run_time=2.0,
        )
        self.wait(0.5)

        # ── Pulse the pin ──
        self.play(
            pin_group.animate.scale(1.15),
            run_time=0.6,
            rate_func=rate_functions.ease_in_out_quad,
        )
        self.play(
            pin_group.animate.scale(1 / 1.15),
            run_time=0.6,
            rate_func=rate_functions.ease_in_out_quad,
        )
        self.wait(0.8)

        # ── Bottom stats bar ──
        stats_y = -1.8
        stats_data = [
            {"value": "Free", "label": "To List", "color": OMIX_GREEN},
            {"value": "24h", "label": "Response", "color": OMIX_BLUE},
            {"value": "100%", "label": "Local", "color": OMIX_PRIMARY},
        ]

        stat_groups = []
        stat_xs = [-3.5, 0, 3.5]
        for i, sd in enumerate(stats_data):
            val = Text(sd["value"], font_size=36, color=sd["color"], weight=BOLD, font=MONO)
            lbl = Text(sd["label"], font_size=14, color=OMIX_DIM, font=MONO)
            lbl.next_to(val, DOWN, buff=0.1)
            g = VGroup(val, lbl)
            g.move_to([stat_xs[i], stats_y, 0])
            stat_groups.append(g)

        # Divider line
        divider = Line(
            start=[-5.5, stats_y + 0.9, 0],
            end=[5.5, stats_y + 0.9, 0],
            color=OMIX_DIM, stroke_width=1, stroke_opacity=0.3,
        )

        self.play(
            FadeIn(divider),
            LaggedStart(
                *[FadeIn(sg, shift=UP * 0.3) for sg in stat_groups],
                lag_ratio=0.25,
            ),
            run_time=1.5,
        )
        self.wait(1.5)

        # ── Loop transition: everything shrinks to center and re-expands ──
        all_content = VGroup(pin_group, kericho, *cat_groups, divider, *stat_groups)

        self.play(
            all_content.animate.scale(0.01, about_point=self.camera_frame_center),
            run_time=0.8,
        )
        self.remove(all_content)

        # Rebuild for seamless loop
        pin2 = VGroup(
            Circle(radius=0.35, color=OMIX_PRIMARY, fill_opacity=1.0, fill_color=OMIX_PRIMARY),
            Polygon([-0.25, 0, 0], [0.25, 0, 0], [0, -0.35, 0],
                    color=OMIX_PRIMARY, fill_opacity=1.0, fill_color=OMIX_PRIMARY),
            Circle(radius=0.12, color=OMIX_BG, fill_opacity=1.0, fill_color=OMIX_BG),
        )
        pin2.move_to([0, 0.8, 0]).scale(0.01)

        kericho2 = Text("Kericho, Kenya", font_size=28, color=OMIX_WHITE, font=MONO)
        kericho2.next_to(pin2, DOWN, buff=0.3)

        cat_groups2 = []
        for cat in categories:
            angle_rad = math.radians(cat["angle"])
            x = math.cos(angle_rad) * cat["dist"]
            y = math.sin(angle_rad) * cat["dist"] + 0.2
            dot = Dot(radius=0.12, color=cat["color"]).move_to([x, y, 0])
            label = Text(cat["label"], font_size=16, color=cat["color"], font=MONO)
            label.next_to(dot, direction=UP * 0.5 + RIGHT * 0.3, buff=0.2)
            line = DashedLine([0, 0.5, 0], [x, y, 0], color=cat["color"], stroke_width=1.5, dash_length=0.1)
            g = VGroup(line, dot, label).scale(0.01)
            cat_groups2.append(g)

        stat_groups2 = []
        for i, sd in enumerate(stats_data):
            val = Text(sd["value"], font_size=36, color=sd["color"], weight=BOLD, font=MONO)
            lbl = Text(sd["label"], font_size=14, color=OMIX_DIM, font=MONO)
            lbl.next_to(val, DOWN, buff=0.1)
            g = VGroup(val, lbl).move_to([stat_xs[i], stats_y, 0]).scale(0.01)
            stat_groups2.append(g)

        divider2 = Line([-5.5, stats_y + 0.9, 0], [5.5, stats_y + 0.9, 0],
                         color=OMIX_DIM, stroke_width=1, stroke_opacity=0.3).scale(0.01)

        self.add(pin2, kericho2, *cat_groups2, divider2, *stat_groups2)
        all2 = VGroup(pin2, kericho2, *cat_groups2, divider2, *stat_groups2)

        self.play(
            all2.animate.scale(100, about_point=self.camera_frame_center),
            run_time=1.0,
        )

        # Pulse pin again
        self.play(pin2.animate.scale(1.15), run_time=0.6, rate_func=rate_functions.ease_in_out_quad)
        self.play(pin2.animate.scale(1 / 1.15), run_time=0.6, rate_func=rate_functions.ease_in_out_quad)
        self.wait(0.8)

        # Animate categories again
        for cg in cat_groups2:
            self.play(FadeIn(cg, shift=UP * 0.15), run_time=0.4)
            self.wait(0.3)

        self.wait(2.0)

        # Fade out
        self.play(FadeOut(all2), run_time=0.8)
        self.wait(0.5)
