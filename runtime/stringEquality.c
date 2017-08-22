#include <string.h>

int isStringEqual(int* l, int* r)
{
    if (strcmp(l, r) == 0)
    {
        return 1;
    }
    else
    {
        return 0;
    }
}
