type ReviewToastStrings = {
  loginAgain: string
  reviewNeedText: string
  reviewSaveError: string
  reviewDuplicate: string
  reviewImageRejected: string
}

/** Не показуємо сирі повідомлення бекенду (укр.) — лише рядки з i18n. */
export function getReviewSubmitErrorMessage(
  status: number,
  apiMessage: string | undefined,
  strings: ReviewToastStrings,
): string {
  const msg = String(apiMessage ?? '').toLowerCase()

  if (status === 401) return strings.loginAgain

  if (msg.includes('review_save_failed')) return strings.reviewSaveError

  if (status === 400) {
    if (
      msg.includes('вже') ||
      msg.includes('уже') ||
      msg.includes('існу') ||
      msg.includes('exist') ||
      msg.includes('duplicate')
    ) {
      return strings.reviewDuplicate
    }
    if (
      msg.includes('фото') ||
      msg.includes('photo') ||
      msg.includes('велик') ||
      msg.includes('больш') ||
      msg.includes('large') ||
      msg.includes('вкладен')
    ) {
      return strings.reviewImageRejected
    }
    if (msg.includes('текст') || msg.includes('слів') || msg.includes('слов')) {
      return strings.reviewNeedText
    }
  }

  return strings.reviewSaveError
}
