import dayjs from "dayjs";

export const formatDisplayDate = (date: Date) =>
  dayjs(date).format("YYYY:MM:DD");
