interface CardProps {
  position: number;
  name: string;
  [key: string]: any;
}

export default function Card({ position, name, ...rest }: CardProps) {
  return (
    <div {...rest}>
      <div className="flex rounded-md shadow-sm justify-center">
        <div className="flex items-center justify-center px-3 rounded-l-md border border-r-0 border-orange-200 bg-orange-200 text-gray-900 text-sm select-none">
          {position}
        </div>
        <div className="flex items-center justify-center w-full px-3 py-2 border rounded-md rounded-l-none shadow-sm border-orange-200 text-gray-900 font-medium select-none">
          {name}
        </div>
      </div>
    </div>
  );
}
