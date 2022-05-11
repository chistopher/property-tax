#!/usr/bin/python3

f = open('mietwert.csv','r')
print('// imported from mietwert.csv')
print('var mietwert = {')
header = f.readline()[:-1].split(';')
for line in f:
    arr = line[:-1].split(';')
    vals = []
    for val in arr[1:]:
        vals.append(float(val))
    print(f'    {int(arr[0])}: {vals},')
print('}')
f.close()
