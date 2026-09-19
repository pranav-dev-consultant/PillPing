export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}
