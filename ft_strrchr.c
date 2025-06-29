/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   ft_strrchr.c                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: cristian <cristian@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2024/09/28 15:38:26 by cristian          #+#    #+#             */
/*   Updated: 2024/09/29 18:42:02 by cristian         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "libft.h"

char	*ft_strrchr(const char *s, int c)
{
	char	*last_found_char;
	int		i;
	char	a;

	last_found_char = 0;
	a = (char)c;
	i = 0;
	while (s[i] != '\0')
	{
		if (s[i] == a)
		{
			last_found_char = (char *)&s[i];
		}
		i++;
	}
	if (a == '\0')
	{
		last_found_char = (char *)&s[i];
	}
	return (last_found_char);
}
