"""
Statistical analysis plan implementation (Phase 3 §11, Phase 4 §17).

Implements the TEST-SELECTION PROCEDURE, not a fixed test. Given a list of
paired differences (same lecture/item under two conditions), this module:
  1. Always computes descriptive statistics first (mean, median, SD, IQR, n).
  2. Checks approximate normality of the paired differences (Shapiro-Wilk).
  3. Branches to a paired t-test (+ Cohen's d) if approximately normal,
     or a Wilcoxon signed-rank test (+ matched-pairs rank-biserial
     correlation) otherwise.
  4. Always reports a bootstrap percentile confidence interval alongside
     the parametric/nonparametric result, since sample sizes are expected
     to be small (Phase 3 §7: N=18-20 for Experiment A, N=10-12 for B/C).

This module requires `scipy` and `numpy`. These are NOT added to
`backend/requirements.txt` (production is unaffected); if used, they
should be recorded in a separate `research/requirements.txt` (Phase 5),
since Phase 4 does not install new dependencies into the shipped product.

Every function returns "insufficient_data" or an explicit error rather
than fabricating a p-value when n is too small for the chosen test to be
meaningful — consistent with Phase 4's "NO FAKE DATA" rule and the
statistical-analysis plan's explicit non-significance-reporting mandate.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from statistics import mean, median, stdev
from typing import Sequence


MIN_N_FOR_INFERENTIAL_TEST = 5  # below this, only descriptive stats are reported


@dataclass
class DescriptiveStats:
    n: int
    mean: float
    median: float
    stdev: float | None
    iqr: tuple[float, float]


@dataclass
class PairedAnalysisResult:
    descriptive: DescriptiveStats
    test_used: str  # "paired_t_test" | "wilcoxon_signed_rank" | "insufficient_data_for_inference"
    statistic: float | None = None
    p_value: float | None = None
    effect_size_name: str | None = None
    effect_size_value: float | None = None
    bootstrap_ci_95: tuple[float, float] | None = None
    normality_check: dict = field(default_factory=dict)
    warnings: list[str] = field(default_factory=list)


def _iqr(values: Sequence[float]) -> tuple[float, float]:
    s = sorted(values)
    n = len(s)
    q1 = s[n // 4]
    q3 = s[(3 * n) // 4]
    return (q1, q3)


def descriptive_stats(values: Sequence[float]) -> DescriptiveStats:
    if not values:
        raise ValueError("descriptive_stats: empty input — DATA REQUIRED.")
    return DescriptiveStats(
        n=len(values),
        mean=mean(values),
        median=median(values),
        stdev=stdev(values) if len(values) > 1 else None,
        iqr=_iqr(values),
    )


def bootstrap_ci(values: Sequence[float], n_resamples: int = 2000, ci: float = 0.95, seed: int | None = None) -> tuple[float, float]:
    """Percentile bootstrap CI for the mean. Distribution-agnostic, appropriate
    for the small samples expected here (Phase 3 §11)."""
    import random
    if len(values) < 2:
        raise ValueError("bootstrap_ci requires at least 2 values — DATA REQUIRED.")
    rng = random.Random(seed)
    n = len(values)
    means = []
    for _ in range(n_resamples):
        sample = [values[rng.randrange(n)] for _ in range(n)]
        means.append(sum(sample) / n)
    means.sort()
    lower_idx = int((1 - ci) / 2 * n_resamples)
    upper_idx = int((1 + ci) / 2 * n_resamples) - 1
    return (means[lower_idx], means[upper_idx])


def analyze_paired_differences(condition_a: Sequence[float], condition_b: Sequence[float]) -> PairedAnalysisResult:
    """
    Full pipeline for one metric across paired items (Phase 3 §11). Prefers
    scipy for the normality test / Wilcoxon test if available; falls back
    to reporting descriptive stats only (with a clear warning) if scipy is
    not installed, rather than silently skipping the check or guessing.
    """
    if len(condition_a) != len(condition_b):
        raise ValueError("condition_a and condition_b must be the same length (paired design).")

    diffs = [a - b for a, b in zip(condition_a, condition_b)]
    n = len(diffs)
    desc = descriptive_stats(diffs)
    warnings: list[str] = []

    if n < MIN_N_FOR_INFERENTIAL_TEST:
        warnings.append(
            f"n={n} is below the minimum ({MIN_N_FOR_INFERENTIAL_TEST}) for a "
            "meaningful inferential test at this sample size. Reporting "
            "descriptive statistics only, per Phase 3 §11 — do not force a "
            "p-value out of an underpowered sample."
        )
        return PairedAnalysisResult(
            descriptive=desc,
            test_used="insufficient_data_for_inference",
            warnings=warnings,
        )

    try:
        import numpy as np
        from scipy import stats as sstats
    except ImportError:
        warnings.append(
            "scipy/numpy not installed in this environment — normality check "
            "and formal test were NOT run. Install `research/requirements.txt` "
            "(Phase 5) before drawing any inferential conclusion. Descriptive "
            "statistics and bootstrap CI (stdlib-only) are still reported."
        )
        return PairedAnalysisResult(
            descriptive=desc,
            test_used="insufficient_data_for_inference",
            bootstrap_ci_95=bootstrap_ci(diffs),
            warnings=warnings,
        )

    shapiro_stat, shapiro_p = sstats.shapiro(diffs)
    is_normal = shapiro_p > 0.05
    normality_check = {"shapiro_statistic": float(shapiro_stat), "shapiro_p": float(shapiro_p), "assumed_normal": is_normal}

    if is_normal:
        t_stat, p_value = sstats.ttest_rel(condition_a, condition_b)
        pooled_sd = desc.stdev if desc.stdev else float("nan")
        cohens_d = desc.mean / pooled_sd if pooled_sd else None
        return PairedAnalysisResult(
            descriptive=desc,
            test_used="paired_t_test",
            statistic=float(t_stat),
            p_value=float(p_value),
            effect_size_name="cohens_d",
            effect_size_value=cohens_d,
            bootstrap_ci_95=bootstrap_ci(diffs),
            normality_check=normality_check,
            warnings=warnings,
        )
    else:
        try:
            w_stat, p_value = sstats.wilcoxon(condition_a, condition_b)
        except ValueError as e:
            warnings.append(f"Wilcoxon test could not be computed: {e}")
            return PairedAnalysisResult(
                descriptive=desc, test_used="insufficient_data_for_inference",
                bootstrap_ci_95=bootstrap_ci(diffs), normality_check=normality_check, warnings=warnings,
            )
        n_pos = sum(1 for d in diffs if d > 0)
        n_neg = sum(1 for d in diffs if d < 0)
        rank_biserial = (n_pos - n_neg) / n if n else None
        return PairedAnalysisResult(
            descriptive=desc,
            test_used="wilcoxon_signed_rank",
            statistic=float(w_stat),
            p_value=float(p_value),
            effect_size_name="matched_pairs_rank_biserial",
            effect_size_value=rank_biserial,
            bootstrap_ci_95=bootstrap_ci(diffs),
            normality_check=normality_check,
            warnings=warnings,
        )


if __name__ == "__main__":
    # Smoke test with synthetic toy data — NOT a research result.
    toy_a = [3.0, 4.0, 2.0, 5.0, 3.0, 4.0]
    toy_b = [2.0, 3.0, 2.0, 4.0, 3.0, 3.0]
    result = analyze_paired_differences(toy_a, toy_b)
    print("Toy smoke test (synthetic numbers, not real data):")
    print(result)
