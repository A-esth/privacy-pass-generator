import Winston, { Logger } from "winston"

const logger : Logger = Winston.createLogger({
  format: Winston.format.combine(
    Winston.format.label({ label: `+`, message: true }),
    Winston.format.simple()
  ),
  transports: [
    new Winston.transports.Console(
      {
        format: Winston.format.combine(
          Winston.format.colorize(),
          Winston.format.simple()
        )
      })
  ]
})

export {
    logger
}