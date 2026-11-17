import { notifications } from "@mantine/notifications";

export const notify = {
  success: (message: string, title: string = "Berhasil") => {
    notifications.show({
      title,
      message,
      color: "teal",
      autoClose: 4000,
    });
  },
  error: (message: string, title: string = "Gagal") => {
    notifications.show({
      title,
      message,
      color: "red",
      autoClose: 5000,
    });
  },
  warning: (message: string, title: string = "Peringatan") => {
    notifications.show({
      title,
      message,
      color: "yellow",
      autoClose: 5000,
    });
  },
  info: (message: string, title: string = "Informasi") => {
    notifications.show({
      title,
      message,
      color: "blue",
      autoClose: 4000,
    });
  },
};
