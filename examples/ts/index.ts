let text: string;
text = "some text";
console.log(text);

interface User {
  name: string;
  email: string;
}

const user: User = {
  email: "johndoe@mail.com",
  name: "John Doe"
}

console.log(user.email, user.name);