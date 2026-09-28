type ButtonProps = JSX.IntrinsicElements['button'];

export default function Button({ type = 'button', ...props }: ButtonProps) {
  return <button type={type} {...props} />;
}

