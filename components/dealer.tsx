interface DealerProps {
  text: string;
  [key: string]: any;
}

export default function Dealer({ text, ...rest }: DealerProps) {
  return (
    <div {...rest}>
      <div className="pt-6 text-center">
        <p className="text-gray-500 leading-normal font-light">Dealer</p>
        <p className="text-lg leading-relaxed font-bold mb-1">{text}</p>
      </div>
    </div>
  );
}
