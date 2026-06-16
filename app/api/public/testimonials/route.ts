import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import {
  FALLBACK_PUBLIC_TESTIMONIALS,
  clampPublicRating,
  isPublicSafeFeedback,
  type PublicTestimonial,
} from '../../../../lib/landingFallbacks';

export const dynamic = 'force-dynamic';

function testimonialResponse(testimonials: PublicTestimonial[], source: 'database' | 'fallback') {
  return NextResponse.json(
    { testimonials, source },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  );
}

export async function GET() {
  try {
    const reviewedFeedbacks = await prisma.feedback.findMany({
      where: {
        status: 'reviewed',
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 12,
      select: {
        userId: true,
        rating: true,
        message: true,
      },
    });

    const publicFeedbacks = reviewedFeedbacks.filter((feedback) => isPublicSafeFeedback(feedback.message));
    if (publicFeedbacks.length === 0) {
      return testimonialResponse(FALLBACK_PUBLIC_TESTIMONIALS, 'fallback');
    }

    const userIds = Array.from(new Set(publicFeedbacks.map((feedback) => feedback.userId)));
    const feedbackProfiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, fullName: true },
    });

    const feedbackProfileMap = new Map(
      feedbackProfiles.map((feedbackProfile) => [feedbackProfile.userId, feedbackProfile.fullName]),
    );
    const publicTestimonials = publicFeedbacks.map((feedback) => ({
      name: feedbackProfileMap.get(feedback.userId) || 'Pengguna Norden',
      label: 'Pengguna Beta',
      rating: clampPublicRating(feedback.rating),
      message: feedback.message,
    }));

    return testimonialResponse(
      publicTestimonials.length > 0 ? publicTestimonials : FALLBACK_PUBLIC_TESTIMONIALS,
      publicTestimonials.length > 0 ? 'database' : 'fallback',
    );
  } catch (error) {
    console.error('Failed to load public testimonials:', error);
    return testimonialResponse(FALLBACK_PUBLIC_TESTIMONIALS, 'fallback');
  }
}
