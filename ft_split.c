/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_split.c                                         :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cristian <cristian@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/10/06 15:14:07 by cyepes            #+#    #+#             */
/*   Updated: 2024/10/12 13:22:43 by cristian         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

static int	ft_count_words(const char *s, char c)
{
	size_t	count_words;
	int		in_a_word;

	count_words = 0;
	in_a_word = 0;
	while (*s)
	{
		if (*s == c)
			in_a_word = 0;
		else
		{
			if (!in_a_word)
			{
				in_a_word = 1;
				count_words++;
			}
		}
		s++;
	}
	return (count_words);
}

static int	ft_custom_strlen(const char *s, char c)
{
	int	len;

	len = 0;
	while (*s && *s != c)
	{
		len++;
		s++;
	}
	return (len);
}

static void	*ft_free(char **tab, int i)
{
	while (i--)
	{
		if (tab[i])
			free(tab[i]);
	}
	free(tab);
	return (NULL);
}

static int	ft_split_str(char **str, const char *s, char c)
{
	int	i;
	int	subs_len;

	i = 0;
	subs_len = 0;
	while (*s)
	{
		while (*s == c)
			++s;
		if (*s)
		{
			subs_len = ft_custom_strlen(s, c);
			str[i] = ft_calloc((subs_len + 1), sizeof(char));
			if (!str[i])
			{
				ft_free(str, i);
				return (0);
			}
			ft_strlcpy(str[i], s, subs_len + 1);
			s = s + subs_len;
			i++;
		}
	}
	str[i] = NULL;
	return (1);
}

char	**ft_split(const char *s, char c)
{
	char	**tab;

	if (!s)
		return (NULL);
	tab = ft_calloc((ft_count_words(s, c) + 1), sizeof(char *));
	if (!tab)
		return (NULL);
	if (!ft_split_str(tab, s, c))
		return (NULL);
	return (tab);
}
