export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export function subtractDay(date) {
    return addDays(date, -1);
}

export function threeMonthsLessOneDay(fromDate) {
    const d = new Date(fromDate);
    d.setMonth(d.getMonth() + 3);
    return subtractDay(d);
}

export function formatDate(date) {
    if (!date || isNaN(new Date(date).getTime())) return "TBC";
    return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}
