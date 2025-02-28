export default function Input({
  placeholder,
  addAnimal,
  isPrimaryChild,
  parent,
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target.value.trim() !== "") {
          addAnimal(parent, e.target.value.trim(), isPrimaryChild);
          e.target.value = "";
        }
      }}
    />
  );
}
