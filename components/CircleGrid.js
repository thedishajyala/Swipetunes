import CircleCard from "./CircleCard";

export default function CircleGrid({ items, onItemClick }) {
    if (!items || items.length === 0) {
        return (
            <div className="flex justify-center py-20 text-gray-500">
                <p>No items to display</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 pb-20">
            {items.map((item, i) => (
                <CircleCard
                    key={i}
                    {...item}
                    onClick={() => onItemClick && onItemClick(item)}
                />
            ))}
        </div>
    );
}
