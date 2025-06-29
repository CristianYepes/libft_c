# Libft: Tu Propia Biblioteca de C

**Libft** es un proyecto fundamental de la **escuela 42** que sienta las bases para comprender en profundidad la programación en lenguaje C.
El objetivo es crear desde cero una biblioteca personalizada que reimplanta muchas de las funciones de la libc estándar de C, además de otras funciones adicionales útiles para futuros proyectos.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Language](https://img.shields.io/badge/language-C-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![42 School](https://img.shields.io/badge/42-School-000000.svg)

---

## Contenido

La biblioteca se divide en tres partes principales:

- **Parte 1:** Funciones de la Libc
- **Parte 2:** Funciones adicionales
- **Parte Bonus:** Funciones para manipular listas enlazadas

---

## Parte 1: Funciones de la Libc

Estas funciones replican el comportamiento de las funciones estándar de C:

### Chequeo de caracteres

- `ft_isalpha` – ¿Es alfabético?
- `ft_isdigit` – ¿Es un dígito?
- `ft_isalnum` – ¿Es alfanumérico?
- `ft_isascii` – ¿Pertenece al conjunto ASCII?
- `ft_isprint` – ¿Es imprimible?

### Manipulación de memoria

- `ft_memset` – Rellena un bloque de memoria.
- `ft_bzero` – Pone a cero un bloque de memoria.
- `ft_memcpy` – Copia bloques de memoria.
- `ft_memmove` – Copia memoria con solapamiento.
- `ft_memchr` – Busca un byte en memoria.
- `ft_memcmp` – Compara bloques de memoria.

### Manipulación de strings

- `ft_strlen` – Longitud de una cadena.
- `ft_strlcpy` – Copia segura de cadenas.
- `ft_strlcat` – Concatena cadenas con tamaño limitado.
- `ft_strchr` – Primera aparición de un carácter.
- `ft_strrchr` – Última aparición de un carácter.
- `ft_strncmp` – Comparación limitada de cadenas.
- `ft_strnstr` – Busca una subcadena dentro de otra.
- `ft_strdup` – Duplica una cadena.

### Conversión

- `ft_atoi` – Convierte una cadena a entero.
- `ft_toupper` – Minúscula → mayúscula.
- `ft_tolower` – Mayúscula → minúscula.

### Asignación de memoria

- `ft_calloc` – Reserva y limpia memoria.

---

## Parte 2: Funciones Adicionales

Estas funciones no están en la libc pero son muy útiles para programación general:

- `ft_substr` – Extrae una subcadena.
- `ft_strjoin` – Une dos cadenas.
- `ft_strtrim` – Elimina caracteres especificados de los extremos.
- `ft_split` – Divide una cadena en subcadenas.
- `ft_itoa` – Convierte un entero a string.
- `ft_strmapi` – Aplica una función a cada carácter.
- `ft_striteri` – Igual que `strmapi`, pero sin retorno.
- `ft_putchar_fd` – Imprime un carácter en un fd.
- `ft_putstr_fd` – Imprime una cadena en un fd.
- `ft_putendl_fd` – Imprime una cadena y salto de línea.
- `ft_putnbr_fd` – Imprime un número en un fd.

---

## Parte 3: Bonus - Listas Enlazadas

Además de strings y memoria, libft incluye una implementación sencilla de **listas enlazadas simples**:

> Definición del nodo (`libft.h`):
```c
typedef struct s_list
{
    void            *content;
    struct s_list   *next;
} t_list;
```

Funciones:

- `ft_lstnew` – Crea un nuevo nodo.
- `ft_lstadd_front` – Añade nodo al principio.
- `ft_lstsize` – Cuenta los nodos.
- `ft_lstlast` – Último nodo.
- `ft_lstadd_back` – Añade nodo al final.
- `ft_lstdelone` – Elimina y libera un nodo.
- `ft_lstclear` – Libera toda la lista.
- `ft_lstiter` – Aplica función a cada nodo.
- `ft_lstmap` – Aplica función y crea nueva lista.

---

## Compilación y Uso

El proyecto viene con un Makefile para compilar fácilmente.

```bash
# Compilar la parte obligatoria
make

# Compilar obligatoria + bonus
make bonus

# Eliminar archivos objeto
make clean

# Eliminar archivos objeto y libft.a
make fclean

# Recompilar desde cero
make re
```

Para usar la biblioteca en tu proyecto:

```bash
cc tu_programa.c -L. -lft -o tu_programa
```

Y recuerda incluir el encabezado:

```c
#include "libft.h"
```

### Ejemplo de uso

```c
#include "libft.h"

int main(void)
{
    char *str = ft_strdup("Hello World");
    ft_putendl_fd(str, 1);
    free(str);
    return 0;
}
```
