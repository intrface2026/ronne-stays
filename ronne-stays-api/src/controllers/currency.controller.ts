import { Request, Response, NextFunction } from 'express'
import { getRates } from '../services/currency.service'

export async function getCurrencyRates(req: Request, res: Response, next: NextFunction) {
  try {
    const rates = await getRates()

    return res.status(200).json({
      success: true,
      data: rates
    })
  } catch (err) {
    next(err)
  }
}
