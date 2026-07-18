NAME = libft.a

CC = cc
CFLAGS = -Wall -Wextra -Werror -fPIE

SRC_DIR = src/
OBJ_DIR = obj/

SRCS =	ft_bzero.c \
		ft_isascii.c \
		ft_memchr.c \
		ft_memmove.c \
		ft_strlen.c \
		ft_isalnum.c \
		ft_isdigit.c \
		ft_memcmp.c \
		ft_memset.c \
		ft_isalpha.c \
		ft_isprint.c \
		ft_memcpy.c \
		ft_strlcpy.c \
		ft_strlcat.c \
		ft_tolower.c \
		ft_toupper.c \
		ft_strchr.c \
		ft_strrchr.c \
		ft_strncmp.c \
		ft_strnstr.c \
		ft_atoi.c \
		ft_calloc.c \
		ft_strdup.c \
		ft_substr.c \
		ft_strjoin.c \
		ft_itoa.c \
		ft_strtrim.c \
		ft_strmapi.c \
		ft_striteri.c \
		ft_putchar_fd.c \
		ft_putstr_fd.c \
		ft_putendl_fd.c \
		ft_putnbr_fd.c \
		ft_split.c \
		ft_free_split.c \
		get_next_line.c \
		get_next_line_utils.c \

BONUS_SRCS = ft_lstnew_bonus.c \
			ft_lstadd_front_bonus.c \
			ft_lstsize_bonus.c \
			ft_lstlast_bonus.c \
			ft_lstadd_back_bonus.c \
			ft_lstdelone_bonus.c \
			ft_lstclear_bonus.c \
			ft_lstiter_bonus.c \
			ft_lstmap_bonus.c \

OBJS = $(addprefix $(OBJ_DIR), $(SRCS:.c=.o))
BONUSOBJS = $(addprefix $(OBJ_DIR), $(BONUS_SRCS:.c=.o))

all: $(NAME)

$(NAME): $(OBJS)
	@echo "\033[1;34mArchiving object files into $(NAME)...\033[0m"
	@ar rcs $(NAME) $(OBJS)
	@echo "\033[1;32m✅ Libft compiled successfully!\033[0m"

bonus:
	@echo "\033[0;33mAdding bonus files...\033[0m"
	@make SRCS="$(SRCS) $(BONUS_SRCS)" OBJS="$(OBJS) $(BONUSOBJS)" all

$(OBJ_DIR)%.o: $(SRC_DIR)%.c
	@mkdir -p $(dir $@)
	@echo "\033[0;33mCompiling $< ...\033[0m"
	@$(CC) $(CFLAGS) -I$(SRC_DIR) -c $< -o $@

clean:
	@echo "\033[1;31mRemoving object files...\033[0m"
	@rm -rf $(OBJ_DIR)

fclean: clean
	@echo "\033[1;31mRemoving $(NAME)...\033[0m"
	@rm -f $(NAME)

re: fclean all

rebonus: fclean bonus

.PHONY: all clean fclean re bonus rebonus
