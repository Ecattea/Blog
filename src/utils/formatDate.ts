import dayjs from "dayjs";

export const DISPLAY_DATE_FORMAT = "YYYY:MM:DD";

export const formatDisplayDate = (date: Date) =>
  dayjs(date).format(DISPLAY_DATE_FORMAT);
